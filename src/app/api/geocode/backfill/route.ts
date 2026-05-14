import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { geocode } from "@/lib/geo";

/**
 * Geocodifica negocios sin coordenadas usando Nominatim.
 * Respeta el rate-limit (1 req/seg).
 */
export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const pending = await prisma.business.findMany({
    where: { latitude: null, address: { not: null } },
    take: 30, // procesamos en lotes para mantener la respuesta razonable
    include: { region: true },
  });

  let updated = 0;
  let failed = 0;

  for (const b of pending) {
    const query = `${b.address}, ${b.region.name}, Argentina`;
    const result = await geocode(query);
    if (result) {
      await prisma.business.update({
        where: { id: b.id },
        data: { latitude: result.lat, longitude: result.lon },
      });
      updated += 1;
    } else {
      failed += 1;
    }
    // Nominatim: 1 req/seg
    await new Promise((r) => setTimeout(r, 1100));
  }

  return NextResponse.json({ processed: pending.length, updated, failed });
}
