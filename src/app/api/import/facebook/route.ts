import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { runActorSync, type FacebookItem } from "@/lib/apify";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

const schema = z.object({
  pages: z.array(z.string().min(1)).min(1).max(50),
  categorySlug: z.string().min(1),
  regionSlug: z.string().min(1),
});

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  const { pages, categorySlug, regionSlug } = parsed.data;
  const supabase = createAdminClient();

  const [{ data: category }, { data: region }] = await Promise.all([
    supabase.from("categories").select("id, name").eq("slug", categorySlug).maybeSingle(),
    supabase.from("regions").select("id, name").eq("slug", regionSlug).maybeSingle(),
  ]);

  if (!category || !region) {
    return NextResponse.json({ error: "Categoría o región no encontrada" }, { status: 400 });
  }

  const actor = process.env.APIFY_FACEBOOK_ACTOR ?? "apify/facebook-pages-scraper";

  const startUrls = pages.map((p) => ({
    url: p.startsWith("http") ? p : `https://www.facebook.com/${p}`,
  }));

  let items: FacebookItem[];
  try {
    items = await runActorSync<unknown, FacebookItem>(
      actor,
      { startUrls, scrapePosts: false },
      { timeoutSecs: 300 }
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }

  let created = 0;
  let updated = 0;

  for (const it of items) {
    const display = it.pageName ?? it.title;
    if (!display) continue;
    const slugBase = slugify(display);
    if (!slugBase) continue;

    const handle = it.pageUrl?.split("/").filter(Boolean).pop() ?? slugBase;

    const data = {
      name: display,
      description: (it.about ?? it.intro ?? `${category.name} en ${region.name}.`).slice(0, 1500),
      category_id: category.id,
      region_id: region.id,
      address: it.address ?? null,
      email: it.email ?? null,
      phone: it.phone ?? null,
      website: it.website ?? null,
      facebook: handle,
      image_url: it.profilePhoto ?? null,
      rating: it.rating ?? null,
      reviews_count: it.ratingCount ?? null,
      source: "facebook",
      external_id: it.pageUrl ?? handle,
    };

    const externalId = it.pageUrl ?? handle;
    const { data: existing } = await supabase
      .from("businesses")
      .select("id")
      .eq("external_id", externalId)
      .eq("source", "facebook")
      .maybeSingle();
    if (existing) {
      await supabase.from("businesses").update(data).eq("id", existing.id);
      updated += 1;
      continue;
    }

    let slug = slugBase;
    let i = 1;
    while (true) {
      const { data: dup } = await supabase.from("businesses").select("id").eq("slug", slug).maybeSingle();
      if (!dup) break;
      i += 1;
      slug = `${slugBase}-${i}`;
    }
    await supabase.from("businesses").insert({ ...data, slug });
    created += 1;
  }

  return NextResponse.json({ created, updated, total: items.length });
}
