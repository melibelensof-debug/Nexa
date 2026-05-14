import { createClient } from "@/lib/supabase/server";
import { RoutePlanner } from "./RoutePlanner";

export const dynamic = "force-dynamic";

export default async function RoutePage() {
  const supabase = createClient();

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, category:categories(name), region:regions(name)")
    .order("name");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Planificador de ruta</h1>
        <p className="text-sm text-slate-500">
          Indica tu punto de partida y agrega negocios o direcciones libres (compras, citas, etc.).
          Nexa te arma el orden óptimo y abre la ruta en Google Maps.
        </p>
      </header>
      <RoutePlanner
        businesses={(businesses ?? []).map((b) => {
          const cat = Array.isArray(b.category) ? b.category[0] : b.category;
          const reg = Array.isArray(b.region) ? b.region[0] : b.region;
          return {
            id: b.id,
            name: b.name,
            category: cat?.name ?? "",
            region: reg?.name ?? "",
          };
        })}
      />
    </div>
  );
}
