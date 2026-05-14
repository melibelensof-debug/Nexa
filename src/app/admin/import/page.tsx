import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { ImportPanels } from "./ImportPanels";

export const dynamic = "force-dynamic";

export default async function ImportAdminPage() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    if (auth.status === 401) redirect("/login?callbackUrl=/admin/import");
    redirect("/dashboard");
  }

  const [categories, regions] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
    prisma.region.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Importar pymes (Apify)</h1>
        <p className="text-sm text-slate-500">
          Trae datos desde Google Maps, Instagram o Facebook y guárdalos en el directorio.
        </p>
      </header>
      <ImportPanels categories={categories} regions={regions} />
    </div>
  );
}
