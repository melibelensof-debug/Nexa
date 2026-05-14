import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { runActorSync, type InstagramItem } from "@/lib/apify";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

const schema = z.object({
  /** Lista de @usuarios o URLs de perfil. */
  usernames: z.array(z.string().min(1)).min(1).max(50),
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
  const { usernames, categorySlug, regionSlug } = parsed.data;

  const [category, region] = await Promise.all([
    prisma.category.findUnique({ where: { slug: categorySlug } }),
    prisma.region.findUnique({ where: { slug: regionSlug } }),
  ]);
  if (!category || !region) {
    return NextResponse.json({ error: "Categoría o región no encontrada" }, { status: 400 });
  }

  const actor = process.env.APIFY_INSTAGRAM_ACTOR ?? "apify/instagram-scraper";

  const directUrls = usernames.map((u) =>
    u.startsWith("http") ? u : `https://www.instagram.com/${u.replace(/^@/, "")}/`
  );

  let items: InstagramItem[];
  try {
    items = await runActorSync<unknown, InstagramItem>(
      actor,
      { directUrls, resultsType: "details", resultsLimit: 1 },
      { timeoutSecs: 300 }
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }

  let created = 0;
  let updated = 0;

  for (const it of items) {
    const handle = it.username;
    const display = it.fullName?.trim() || handle;
    if (!handle || !display) continue;

    const slugBase = slugify(display);
    if (!slugBase) continue;

    let address: string | null = null;
    if (it.businessAddressJson) {
      try {
        const a = JSON.parse(it.businessAddressJson);
        address = [a.street_address, a.city_name, a.country_code].filter(Boolean).join(", ");
      } catch {
        /* ignore */
      }
    }

    const data = {
      name: display,
      description: it.biography?.slice(0, 1500) ?? `${category.name} en ${region.name}.`,
      categoryId: category.id,
      regionId: region.id,
      address,
      email: it.businessEmail ?? null,
      phone: it.businessPhoneNumber ?? null,
      website: it.externalUrl ?? null,
      instagram: handle,
      imageUrl: it.profilePicUrl ?? null,
      source: "instagram",
      externalId: handle,
    };

    const existing = await prisma.business.findFirst({ where: { externalId: handle, source: "instagram" } });
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
