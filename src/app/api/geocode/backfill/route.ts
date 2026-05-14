import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { geocode } from "@/lib/geo";

/**
 * Geocodifica negocios sin coordenadas usando Nominatim.
 * Respeta el rate-limit (1 req/seg).
 */
export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const supabase = createAdminClient();

  const { data: pending } = await supabase
    .from("businesses")
    .select("id, address, region:regions(name)")
    .is("latitude", null)
    .not("address", "is", null)
    .limit(30);

  let updated = 0;
  let failed = 0;

  for (const b of pending ?? []) {
    const reg = Array.isArray(b.region) ? b.region[0] : b.region;
    const query = `${b.address}, ${reg?.name ?? ""}, Argentina`;
    const result = await geocode(query);
    if (result) {
      await supabase
        .from("businesses")
        .update({ latitude: result.lat, longitude: result.lon })
        .eq("id", b.id);
      updated += 1;
    } else {
      failed += 1;
    }
    await new Promise((r) => setTimeout(r, 1100));
  }

  return NextResponse.json({ processed: pending?.length ?? 0, updated, failed });
}
