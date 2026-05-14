import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? undefined;
  const region = searchParams.get("region") ?? undefined;
  const q = searchParams.get("q") ?? undefined;

  const businesses = await prisma.business.findMany({
    where: {
      AND: [
        category ? { category: { slug: category } } : {},
        region ? { region: { slug: region } } : {},
        q
          ? {
              OR: [
                { name: { contains: q } },
                { description: { contains: q } },
              ],
            }
          : {},
      ],
    },
    include: { category: true, region: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: businesses });
}

const createSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().min(10).max(2000),
  categoryId: z.string().min(1),
  regionId: z.string().min(1),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  website: z.string().trim().url().optional().or(z.literal("")),
  whatsapp: z.string().trim().max(40).optional().or(z.literal("")),
  instagram: z.string().trim().max(80).optional().or(z.literal("")),
  facebook: z.string().trim().max(80).optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const empty = (v: string | undefined) => (v && v.length > 0 ? v : null);

  // Generar slug único
  const baseSlug = slugify(data.name);
  let slug = baseSlug;
  let i = 1;
  while (await prisma.business.findUnique({ where: { slug } })) {
    i += 1;
    slug = `${baseSlug}-${i}`;
  }

  const business = await prisma.business.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      categoryId: data.categoryId,
      regionId: data.regionId,
      email: empty(data.email),
      phone: empty(data.phone),
      website: empty(data.website),
      whatsapp: empty(data.whatsapp),
      instagram: empty(data.instagram),
      facebook: empty(data.facebook),
      address: empty(data.address),
      ownerId: session.user.id,
    },
  });

  return NextResponse.json({ data: business }, { status: 201 });
}
