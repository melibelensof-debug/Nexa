import { haversineKm } from "@/lib/geo";

export type Stop = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  /** Minutos estimados que llevará el stop (compra, cita, etc.) */
  durationMin?: number;
};

export type RouteResult = {
  order: Stop[];
  totalKm: number;
  travelMinutes: number;
  totalMinutes: number;
  legs: { from: string; to: string; km: number; minutes: number }[];
};

/** Velocidad asumida en ciudad para estimar minutos de viaje. */
const URBAN_KMH = 25;

function totalDistance(stops: Stop[]): number {
  let total = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    total += haversineKm(
      { lat: stops[i].lat, lon: stops[i].lon },
      { lat: stops[i + 1].lat, lon: stops[i + 1].lon }
    );
  }
  return total;
}

/** Heurística nearest-neighbor partiendo de la posición 0 (origen fijo). */
function nearestNeighbor(stops: Stop[]): Stop[] {
  if (stops.length <= 2) return [...stops];
  const remaining = stops.slice(1);
  const path: Stop[] = [stops[0]];

  while (remaining.length > 0) {
    const last = path[path.length - 1];
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineKm(
        { lat: last.lat, lon: last.lon },
        { lat: remaining[i].lat, lon: remaining[i].lon }
      );
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    path.push(remaining.splice(bestIdx, 1)[0]);
  }
  return path;
}

/**
 * Mejora la ruta con 2-opt manteniendo fijo el primer stop (origen).
 * Reduce notablemente las "cruzadas" del nearest-neighbor.
 */
function twoOpt(path: Stop[]): Stop[] {
  if (path.length < 4) return path;
  let best = [...path];
  let improved = true;

  while (improved) {
    improved = false;
    for (let i = 1; i < best.length - 2; i++) {
      for (let k = i + 1; k < best.length - 1; k++) {
        const candidate = [
          ...best.slice(0, i),
          ...best.slice(i, k + 1).reverse(),
          ...best.slice(k + 1),
        ];
        if (totalDistance(candidate) + 1e-9 < totalDistance(best)) {
          best = candidate;
          improved = true;
        }
      }
    }
  }
  return best;
}

/**
 * Optimiza la ruta a partir de un origen fijo (primer stop) y todas las paradas restantes.
 * Devuelve el orden óptimo aproximado, la distancia total y el tiempo total.
 */
export function optimizeRoute(stops: Stop[]): RouteResult {
  if (stops.length === 0) {
    return { order: [], totalKm: 0, travelMinutes: 0, totalMinutes: 0, legs: [] };
  }

  const nn = nearestNeighbor(stops);
  const order = twoOpt(nn);

  const legs: RouteResult["legs"] = [];
  let totalKm = 0;
  for (let i = 0; i < order.length - 1; i++) {
    const km = haversineKm(
      { lat: order[i].lat, lon: order[i].lon },
      { lat: order[i + 1].lat, lon: order[i + 1].lon }
    );
    const minutes = (km / URBAN_KMH) * 60;
    legs.push({ from: order[i].name, to: order[i + 1].name, km, minutes });
    totalKm += km;
  }

  const travelMinutes = (totalKm / URBAN_KMH) * 60;
  const stopMinutes = order.reduce((acc, s) => acc + (s.durationMin ?? 0), 0);

  return {
    order,
    totalKm,
    travelMinutes,
    totalMinutes: travelMinutes + stopMinutes,
    legs,
  };
}

/** Construye una URL de Google Maps con todas las paradas en orden. */
export function buildGoogleMapsUrl(order: Stop[]): string {
  if (order.length === 0) return "https://www.google.com/maps";
  const origin = `${order[0].lat},${order[0].lon}`;
  const dest = `${order[order.length - 1].lat},${order[order.length - 1].lon}`;
  const waypoints = order
    .slice(1, -1)
    .map((s) => `${s.lat},${s.lon}`)
    .join("|");

  const params = new URLSearchParams({
    api: "1",
    origin,
    destination: dest,
    travelmode: "driving",
  });
  if (waypoints) params.set("waypoints", waypoints);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
