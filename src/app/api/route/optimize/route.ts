import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { geocode } from "@/lib/geo";
import { optimizeRoute, buildGoogleMapsUrl, type Stop } from "@/lib/route";

const schema = z.object({
  /** Dirección u origen del usuario (si no se envían lat/lon). */
  origin: z
    .object({
      address: z.string().min(2).optional(),
      lat: z.number().optional(),
      lon: z.number().optional(),
    })
    .refine((o) => o.address || (typeof o.lat === "number" && typeof o.lon === "number"), {
      message: "Debe enviar address o lat/lon",
    }),
  /** Lista de paradas: pueden ser businessId o address libre. */
  stops: z
    .array(
      z.object({
        label: z.string().min(1).optional(),
        businessId: z.string().optional(),
        address: z.string().optional(),
        durationMin: z.number().int().min(0).max(480).optional(),
      })
    )
    .min(1)
    .max(20),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  const { origin, stops } = parsed.data;

  // Resolver origen
  let originStop: Stop;
  if (origin.lat != null && origin.lon != null) {
    originStop = { id: "origin", name: "Origen", lat: origin.lat, lon: origin.lon };
  } else if (origin.address) {
    const g = await geocode(origin.address);
    if (!g) return NextResponse.json({ error: `No se pudo geolocalizar el origen: ${origin.address}` }, { status: 400 });
    originStop = { id: "origin", name: origin.address, lat: g.lat, lon: g.lon };
  } else {
    return NextResponse.json({ error: "Origen inválido" }, { status: 400 });
  }

  // Resolver cada parada
  const resolved: Stop[] = [originStop];
  const unresolved: string[] = [];

  for (let idx = 0; idx < stops.length; idx++) {
    const s = stops[idx];

    if (s.businessId) {
      const biz = await prisma.business.findUnique({
        where: { id: s.businessId },
        include: { region: true },
      });
      if (!biz) {
        unresolved.push(s.label ?? s.businessId);
        continue;
      }
      let lat = biz.latitude;
      let lon = biz.longitude;
      if (lat == null || lon == null) {
        const query = `${biz.address ?? biz.name}, ${biz.region.name}, Argentina`;
        const g = await geocode(query);
        if (!g) {
          unresolved.push(biz.name);
          continue;
        }
        lat = g.lat;
        lon = g.lon;
        await prisma.business.update({ where: { id: biz.id }, data: { latitude: lat, longitude: lon } });
      }
      resolved.push({
        id: biz.id,
        name: s.label ?? biz.name,
        lat,
        lon,
        durationMin: s.durationMin ?? 30,
      });
      continue;
    }

    if (s.address) {
      const g = await geocode(s.address);
      if (!g) {
        unresolved.push(s.address);
        continue;
      }
      resolved.push({
        id: `addr-${idx}`,
        name: s.label ?? s.address,
        lat: g.lat,
        lon: g.lon,
        durationMin: s.durationMin ?? 30,
      });
      continue;
    }

    unresolved.push(s.label ?? `Parada ${idx + 1}`);
  }

  if (resolved.length < 2) {
    return NextResponse.json({ error: "No hay paradas válidas", unresolved }, { status: 400 });
  }

  const result = optimizeRoute(resolved);

  return NextResponse.json({
    ...result,
    googleMapsUrl: buildGoogleMapsUrl(result.order),
    unresolved,
  });
}
