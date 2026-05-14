import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function CategoryDetail({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!category) notFound();

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, slug, name, description, region:regions(name)")
    .eq("category_id", category.id)
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/categories" className="text-sm text-brand-600 hover:underline">
          ← Todas las categorías
        </Link>
      </div>
      <header>
        <div className="text-3xl">{category.icon ?? "🏷️"}</div>
        <h1 className="mt-1 text-2xl font-bold">{category.name}</h1>
      </header>

      {!businesses || businesses.length === 0 ? (
        <p className="text-slate-500">Aún no hay negocios en esta categoría.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((b) => {
            const reg = Array.isArray(b.region) ? b.region[0] : b.region;
            return (
              <li
                key={b.id}
                className="rounded-xl border bg-white p-5 hover:border-brand-500 hover:shadow"
              >
                <Link href={`/businesses/${b.slug}`} className="block">
                  <div className="text-xs uppercase tracking-wide text-brand-600">
                    {reg?.name}
                  </div>
                  <div className="mt-1 text-lg font-semibold">{b.name}</div>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                    {b.description}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
