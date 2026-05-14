import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { runActorSync, type GMapsItem } from "@/lib/apify";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

const schema = z.object({
  searchTerms: z.array(z.string().min(1)).min(1).max(10),
  maxItems: z.number().int().min(1).max(200).default(20),
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
  const { searchTerms, maxItems, categorySlug, regionSlug } = parsed.data;

  const supabase = createAdminClient();

  const [{ data: category }, { data: region }] = await Promise.all([
    supabase.from("categories").select("id, name").eq("slug", categorySlug).maybeSingle(),
    supabase.from("regions").select("id, name").eq("slug", regionSlug).maybeSingle(),
  ]);

  if (!category || !region) {
    return NextResponse.json({ error: "Categoría o región no encontrada" }, { status: 400 });
  }

  const actor = process.env.APIFY_GMAPS_ACTOR ?? "compass/crawler-google-places";

  let items: GMapsItem[];
  try {
    items = await runActorSync<unknown, GMapsItem>(
      actor,
      { searchStringsArray: searchTerms, maxCrawledPlacesPerSearch: maxItems, language: "es" },
      { timeoutSecs: 300 }
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }

  let created = 0;
  let updated = 0;

  for (const it of items) {
    if (!it.title) continue;
    const slugBase = slugify(it.title);
    if (!slugBase) continue;

    const data = {
      name: it.title,
      description: it.description?.slice(0, 1500) ?? `${category.name} en ${region.name}.`,
      category_id: category.id,
      region_id: region.id,
      address: it.address ?? null,
      phone: it.phone ?? null,
      website: it.website ?? null,
      latitude: it.location?.lat ?? null,
      longitude: it.location?.lng ?? null,
      rating: it.totalScore ?? null,
      reviews_count: it.reviewsCount ?? null,
      image_url: it.imageUrl ?? null,
      hours: it.openingHours ? JSON.stringify(it.openingHours) : null,
      source: "google_maps",
      external_id: it.placeId ?? null,
    };

    if (it.placeId) {
      const { data: existing } = await supabase
        .from("businesses")
        .select("id")
        .eq("external_id", it.placeId)
        .eq("source", "google_maps")
        .maybeSingle();
      if (existing) {
        await supabase.from("businesses").update(data).eq("id", existing.id);
        updated += 1;
        continue;
      }
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
