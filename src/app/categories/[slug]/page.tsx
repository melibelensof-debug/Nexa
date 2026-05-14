import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function CategoryDetail({
  params,
}: {
  params: { slug: string };
}) {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
    include: {
      businesses: { include: { region: true }, orderBy: { name: "asc" } },
    },
  });

  if (!category) notFound();

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

      {category.businesses.length === 0 ? (
        <p className="text-slate-500">Aún no hay negocios en esta categoría.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {category.businesses.map((b) => (
            <li
              key={b.id}
              className="rounded-xl border bg-white p-5 hover:border-brand-500 hover:shadow"
            >
              <Link href={`/businesses/${b.slug}`} className="block">
                <div className="text-xs uppercase tracking-wide text-brand-600">
                  {b.region.name}
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
    </div>
  );
}
