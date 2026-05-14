import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { geocode } from "@/lib/geo";
import { optimizeRoute, buildGoogleMapsUrl, type Stop } from "@/lib/route";

const schema = z.object({
  origin: z
    .object({
      address: z.string().min(2).optional(),
      lat: z.number().optional(),
      lon: z.number().optional(),
    })
    .refine((o) => o.address || (typeof o.lat === "number" && typeof o.lon === "number"), {
      message: "Debe enviar address o lat/lon",
    }),
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
  const supabase = createClient();
  const admin = createAdminClient();

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

  const resolved: Stop[] = [originStop];
  const unresolved: string[] = [];

  for (let idx = 0; idx < stops.length; idx++) {
    const s = stops[idx];

    if (s.businessId) {
      const { data: biz } = await supabase
        .from("businesses")
        .select("id, name, address, latitude, longitude, region:regions(name)")
        .eq("id", s.businessId)
        .maybeSingle();

      if (!biz) {
        unresolved.push(s.label ?? s.businessId);
        continue;
      }

      let lat = biz.latitude;
      let lon = biz.longitude;
      if (lat == null || lon == null) {
        const reg = Array.isArray(biz.region) ? biz.region[0] : biz.region;
        const query = `${biz.address ?? biz.name}, ${reg?.name ?? ""}, Argentina`;
        const g = await geocode(query);
        if (!g) {
          unresolved.push(biz.name);
          continue;
        }
        lat = g.lat;
        lon = g.lon;
        // Persistimos las coords (usando admin para bypassar RLS)
        await admin.from("businesses").update({ latitude: lat, longitude: lon }).eq("id", biz.id);
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
