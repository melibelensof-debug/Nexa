import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { ImportPanels } from "./ImportPanels";

export const dynamic = "force-dynamic";

export default async function ImportAdminPage() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    if (auth.status === 401) redirect("/login?redirectedFrom=/admin/import");
    redirect("/dashboard");
  }

  const supabase = createClient();
  const [{ data: categories }, { data: regions }] = await Promise.all([
    supabase.from("categories").select("slug, name").order("name"),
    supabase.from("regions").select("slug, name").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Importar pymes (Apify)</h1>
        <p className="text-sm text-slate-500">
          Trae datos desde Google Maps, Instagram o Facebook y guárdalos en el directorio.
        </p>
      </header>
      <ImportPanels categories={categories ?? []} regions={regions ?? []} />
    </div>
  );
}
