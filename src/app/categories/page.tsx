import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const supabase = createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, icon, businesses:businesses(count)")
    .order("name");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Categorías</h1>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(categories ?? []).map((c) => {
          const count = Array.isArray(c.businesses) ? c.businesses[0]?.count ?? 0 : 0;
          return (
            <li key={c.id}>
              <Link
                href={`/categories/${c.slug}`}
                className="flex items-center justify-between rounded-xl border bg-white p-4 hover:border-brand-500 hover:shadow"
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl">{c.icon ?? "🏷️"}</span>
                  <span className="font-medium">{c.name}</span>
                </span>
                <span className="text-sm text-slate-500">{count} negocios</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
