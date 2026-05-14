import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function HomePage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q?.trim();

  const [categories, featured] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.business.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q } },
              { description: { contains: q } },
            ],
          }
        : undefined,
      include: { category: true, region: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  return (
    <div className="space-y-12">
      <section className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-10 text-white shadow">
        <h1 className="text-3xl font-bold sm:text-4xl">
          Encuentra pymes por categoría y región
        </h1>
        <p className="mt-3 max-w-2xl text-brand-50">
          Nexa conecta emprendimientos de distintas regiones. Busca, descubre y
          colabora sin perderte entre redes sociales.
        </p>
        <form action="/" className="mt-6 flex max-w-xl gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por nombre o descripción"
            className="flex-1 rounded-lg border-0 px-4 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-white/60"
          />
          <button
            type="submit"
            className="rounded-lg bg-white px-4 py-2 font-semibold text-brand-700 hover:bg-brand-50"
          >
            Buscar
          </button>
        </form>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-semibold">Categorías</h2>
          <Link href="/categories" className="text-sm text-brand-600 hover:underline">
            Ver todas
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/categories/${c.slug}`}
              className="rounded-xl border bg-white p-4 text-center hover:border-brand-500 hover:shadow"
            >
              <div className="text-2xl">{c.icon ?? "🏷️"}</div>
              <div className="mt-1 text-sm font-medium">{c.name}</div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-semibold">
            {q ? `Resultados para "${q}"` : "Negocios destacados"}
          </h2>
          <Link href="/businesses" className="text-sm text-brand-600 hover:underline">
            Ver todos
          </Link>
        </div>
        {featured.length === 0 ? (
          <p className="text-slate-500">No se encontraron negocios.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((b) => (
              <li
                key={b.id}
                className="rounded-xl border bg-white p-5 hover:border-brand-500 hover:shadow"
              >
                <Link href={`/businesses/${b.slug}`} className="block">
                  <div className="text-xs uppercase tracking-wide text-brand-600">
                    {b.category.name} · {b.region.name}
                  </div>
                  <div className="mt-1 text-lg font-semibold">{b.name}</div>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                    {b.description}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
