import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BusinessesPage({
  searchParams,
}: {
  searchParams: { category?: string; region?: string; q?: string };
}) {
  const { category, region, q } = searchParams;
  const supabase = createClient();

  const [{ data: categories }, { data: regions }] = await Promise.all([
    supabase.from("categories").select("id, slug, name").order("name"),
    supabase.from("regions").select("id, slug, name").order("name"),
  ]);

  let query = supabase
    .from("businesses")
    .select("id, slug, name, description, category:categories!inner(name, slug), region:regions!inner(name, slug)")
    .order("name");

  if (category) {
    query = query.eq("categories.slug", category);
  }
  if (region) {
    query = query.eq("regions.slug", region);
  }
  if (q) {
    query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const { data: businesses } = await query;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Negocios</h1>

      <form className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-4">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar..."
          className="rounded-lg border px-3 py-2 sm:col-span-2"
        />
        <select name="category" defaultValue={category ?? ""} className="rounded-lg border px-3 py-2">
          <option value="">Todas las categorías</option>
          {(categories ?? []).map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <select name="region" defaultValue={region ?? ""} className="rounded-lg border px-3 py-2">
          <option value="">Todas las regiones</option>
          {(regions ?? []).map((r) => (
            <option key={r.id} value={r.slug}>{r.name}</option>
          ))}
        </select>
        <button
          type="submit"
          className="sm:col-span-4 rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700"
        >
          Filtrar
        </button>
      </form>

      {!businesses || businesses.length === 0 ? (
        <p className="text-slate-500">No hay resultados con esos filtros.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((b) => {
            const cat = Array.isArray(b.category) ? b.category[0] : b.category;
            const reg = Array.isArray(b.region) ? b.region[0] : b.region;
            return (
              <li
                key={b.id}
                className="rounded-xl border bg-white p-5 hover:border-brand-500 hover:shadow"
              >
                <Link href={`/businesses/${b.slug}`} className="block">
                  <div className="text-xs uppercase tracking-wide text-brand-600">
                    {cat?.name} · {reg?.name}
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
