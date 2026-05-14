import { prisma } from "@/lib/prisma";
import { RoutePlanner } from "./RoutePlanner";

export const dynamic = "force-dynamic";

export default async function RoutePage() {
  const businesses = await prisma.business.findMany({
    orderBy: { name: "asc" },
    include: { category: true, region: true },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Planificador de ruta</h1>
        <p className="text-sm text-slate-500">
          Indica tu punto de partida y agrega negocios o direcciones libres (compras, citas, etc.).
          Nexa te arma el orden óptimo y abre la ruta en Google Maps.
        </p>
      </header>
      <RoutePlanner businesses={businesses.map((b) => ({
        id: b.id,
        name: b.name,
        category: b.category.name,
        region: b.region.name,
      }))} />
    </div>
  );
}
