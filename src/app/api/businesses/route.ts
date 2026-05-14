import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? undefined;
  const region = searchParams.get("region") ?? undefined;
  const q = searchParams.get("q") ?? undefined;

  const supabase = createClient();

  let query = supabase
    .from("businesses")
    .select("*, category:categories!inner(name, slug), region:regions!inner(name, slug)")
    .order("name");

  if (category) query = query.eq("categories.slug", category);
  if (region) query = query.eq("regions.slug", region);
  if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
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
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json().catch(() => null);
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
  while (true) {
    const { data: dup } = await supabase
      .from("businesses")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!dup) break;
    i += 1;
    slug = `${baseSlug}-${i}`;
  }

  const { data: business, error } = await supabase
    .from("businesses")
    .insert({
      name: data.name,
      slug,
      description: data.description,
      category_id: data.categoryId,
      region_id: data.regionId,
      email: empty(data.email),
      phone: empty(data.phone),
      website: empty(data.website),
      whatsapp: empty(data.whatsapp),
      instagram: empty(data.instagram),
      facebook: empty(data.facebook),
      address: empty(data.address),
      owner_id: user.id,
      source: "manual",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: business }, { status: 201 });
}
