import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, slug, name, description, category:categories(name), region:regions(name)")
    .eq("owner_id", user!.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mi panel</h1>
          <p className="text-sm text-slate-500">
            Bienvenido{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}.
          </p>
        </div>
        <Link
          href="/dashboard/businesses/new"
          className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700"
        >
          + Nuevo negocio
        </Link>
      </div>

      {!businesses || businesses.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center">
          <p className="text-slate-600">Aún no has registrado ningún negocio.</p>
          <Link
            href="/dashboard/businesses/new"
            className="mt-4 inline-block text-brand-600 hover:underline"
          >
            Registrar mi primer negocio
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {businesses.map((b) => {
            const cat = Array.isArray(b.category) ? b.category[0] : b.category;
            const reg = Array.isArray(b.region) ? b.region[0] : b.region;
            return (
              <li
                key={b.id}
                className="rounded-xl border bg-white p-5 hover:border-brand-500"
              >
                <div className="text-xs uppercase tracking-wide text-brand-600">
                  {cat?.name} · {reg?.name}
                </div>
                <div className="mt-1 text-lg font-semibold">{b.name}</div>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                  {b.description}
                </p>
                <div className="mt-3 flex gap-3 text-sm">
                  <Link
                    href={`/businesses/${b.slug}`}
                    className="text-brand-600 hover:underline"
                  >
                    Ver
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
