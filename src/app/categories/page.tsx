import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { businesses: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Categorías</h1>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <li key={c.id}>
            <Link
              href={`/categories/${c.slug}`}
              className="flex items-center justify-between rounded-xl border bg-white p-4 hover:border-brand-500 hover:shadow"
            >
              <span className="flex items-center gap-3">
                <span className="text-2xl">{c.icon ?? "🏷️"}</span>
                <span className="font-medium">{c.name}</span>
              </span>
              <span className="text-sm text-slate-500">
                {c._count.businesses} negocios
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
