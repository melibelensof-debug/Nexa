import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { runActorSync, type FacebookItem } from "@/lib/apify";
import { prisma } from "@/lib/prisma";
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

  const [category, region] = await Promise.all([
    prisma.category.findUnique({ where: { slug: categorySlug } }),
    prisma.region.findUnique({ where: { slug: regionSlug } }),
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
      categoryId: category.id,
      regionId: region.id,
      address: it.address ?? null,
      email: it.email ?? null,
      phone: it.phone ?? null,
      website: it.website ?? null,
      facebook: handle,
      imageUrl: it.profilePhoto ?? null,
      rating: it.rating ?? null,
      reviewsCount: it.ratingCount ?? null,
      source: "facebook",
      externalId: it.pageUrl ?? handle,
    };

    const externalId = it.pageUrl ?? handle;
    const existing = await prisma.business.findFirst({ where: { externalId, source: "facebook" } });
    if (existing) {
      await prisma.business.update({ where: { id: existing.id }, data });
      updated += 1;
      continue;
    }

    let slug = slugBase;
    let i = 1;
    while (await prisma.business.findUnique({ where: { slug } })) {
      i += 1;
      slug = `${slugBase}-${i}`;
    }
    await prisma.business.create({ data: { ...data, slug } });
    created += 1;
  }

  return NextResponse.json({ created, updated, total: items.length });
}
