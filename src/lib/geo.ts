import { prisma } from "@/lib/prisma";

/**
 * Geocodificación usando Nominatim (OpenStreetMap).
 * Política de uso: máx 1 req/seg + User-Agent identificado.
 * https://operations.osmfoundation.org/policies/nominatim/
 */
export async function geocode(query: string): Promise<{ lat: number; lon: number; display?: string } | null> {
  const q = query.trim();
  if (!q) return null;

  const cached = await prisma.geocodeCache.findUnique({ where: { query: q } });
  if (cached) {
    return { lat: cached.latitude, lon: cached.longitude, display: cached.display ?? undefined };
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Nexa-App/0.1 (contact: dev@nexa.local)",
      "Accept-Language": "es",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  if (data.length === 0) return null;

  const lat = parseFloat(data[0].lat);
  const lon = parseFloat(data[0].lon);
  const display = data[0].display_name;

  await prisma.geocodeCache
    .create({
      data: { query: q, latitude: lat, longitude: lon, display },
    })
    .catch(() => {
      /* ignore unique race */
    });

  return { lat, lon, display };
}

/** Distancia Haversine en kilómetros entre dos coordenadas. */
export function haversineKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
