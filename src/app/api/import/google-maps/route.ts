import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { runActorSync, type GMapsItem } from "@/lib/apify";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

const schema = z.object({
  /** Búsqueda libre, ej: "panaderia salta argentina". */
  searchTerms: z.array(z.string().min(1)).min(1).max(10),
  maxItems: z.number().int().min(1).max(200).default(20),
  /** Slug de la categoría destino (debe existir). */
  categorySlug: z.string().min(1),
  /** Slug de la región destino (debe existir). */
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

  const [category, region] = await Promise.all([
    prisma.category.findUnique({ where: { slug: categorySlug } }),
    prisma.region.findUnique({ where: { slug: regionSlug } }),
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
      categoryId: category.id,
      regionId: region.id,
      address: it.address ?? null,
      phone: it.phone ?? null,
      website: it.website ?? null,
      latitude: it.location?.lat ?? null,
      longitude: it.location?.lng ?? null,
      rating: it.totalScore ?? null,
      reviewsCount: it.reviewsCount ?? null,
      imageUrl: it.imageUrl ?? null,
      hours: it.openingHours ? JSON.stringify(it.openingHours) : null,
      source: "google_maps",
      externalId: it.placeId ?? null,
    };

    if (it.placeId) {
      const existing = await prisma.business.findFirst({ where: { externalId: it.placeId, source: "google_maps" } });
      if (existing) {
        await prisma.business.update({ where: { id: existing.id }, data });
        updated += 1;
        continue;
      }
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
