"use client";

import { useState } from "react";

type BusinessOpt = { id: string; name: string; category: string; region: string };

type StopInput = {
  key: string;
  mode: "business" | "address";
  businessId?: string;
  address?: string;
  label?: string;
  durationMin: number;
};

type Leg = { from: string; to: string; km: number; minutes: number };
type RouteResponse = {
  order: { id: string; name: string; lat: number; lon: number; durationMin?: number }[];
  totalKm: number;
  travelMinutes: number;
  totalMinutes: number;
  legs: Leg[];
  googleMapsUrl: string;
  unresolved: string[];
};

const newStop = (mode: StopInput["mode"]): StopInput => ({
  key: crypto.randomUUID(),
  mode,
  durationMin: 30,
});

function fmtMinutes(m: number): string {
  const h = Math.floor(m / 60);
  const min = Math.round(m % 60);
  if (h === 0) return `${min} min`;
  return `${h}h ${min}min`;
}

export function RoutePlanner({ businesses }: { businesses: BusinessOpt[] }) {
  const [originAddress, setOriginAddress] = useState("");
  const [stops, setStops] = useState<StopInput[]>([newStop("business")]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RouteResponse | null>(null);

  function updateStop(key: string, patch: Partial<StopInput>) {
    setStops((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  }

  function removeStop(key: string) {
    setStops((prev) => prev.filter((s) => s.key !== key));
  }

  async function useGeolocation() {
    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOriginAddress(`${pos.coords.latitude},${pos.coords.longitude}`);
      },
      () => setError("No se pudo obtener tu ubicación")
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    let originPayload: Record<string, unknown> = {};
    const trimmed = originAddress.trim();
    const coordMatch = trimmed.match(/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/);
    if (coordMatch) {
      originPayload = { lat: Number(coordMatch[1]), lon: Number(coordMatch[2]) };
    } else {
      originPayload = { address: trimmed };
    }

    const payloadStops = stops
      .filter((s) => (s.mode === "business" ? s.businessId : s.address))
      .map((s) => ({
        businessId: s.mode === "business" ? s.businessId : undefined,
        address: s.mode === "address" ? s.address : undefined,
        label: s.label || undefined,
        durationMin: s.durationMin,
      }));

    if (payloadStops.length === 0) {
      setError("Agrega al menos una parada válida");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/route/optimize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin: originPayload, stops: payloadStops }),
    });

    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "No se pudo calcular la ruta");
      return;
    }
    setResult(data);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-white p-5">
        <div>
          <label className="block text-sm">
            <span className="text-slate-700">Punto de partida</span>
            <input
              type="text"
              required
              value={originAddress}
              onChange={(e) => setOriginAddress(e.target.value)}
              placeholder="Av. Corrientes 1234, CABA  |  -34.6037,-58.3816"
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <button
            type="button"
            onClick={useGeolocation}
            className="mt-2 text-sm text-brand-600 hover:underline"
          >
            📍 Usar mi ubicación actual
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">Paradas</h3>
          {stops.map((s, idx) => (
            <div key={s.key} className="rounded-lg border p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">#{idx + 1}</span>
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => updateStop(s.key, { mode: "business" })}
                    className={`rounded-full px-2 py-1 ${s.mode === "business" ? "bg-brand-600 text-white" : "bg-slate-100"}`}
                  >
                    Negocio
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStop(s.key, { mode: "address" })}
                    className={`rounded-full px-2 py-1 ${s.mode === "address" ? "bg-brand-600 text-white" : "bg-slate-100"}`}
                  >
                    Dirección
                  </button>
                  {stops.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStop(s.key)}
                      className="rounded-full bg-red-50 px-2 py-1 text-red-600"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>

              {s.mode === "business" ? (
                <select
                  value={s.businessId ?? ""}
                  onChange={(e) => updateStop(s.key, { businessId: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  required
                >
                  <option value="" disabled>Selecciona un negocio...</option>
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} — {b.category} ({b.region})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={s.address ?? ""}
                  onChange={(e) => updateStop(s.key, { address: e.target.value })}
                  placeholder="Ej: Av. Belgrano 1500, Mendoza"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              )}

              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <input
                  type="text"
                  value={s.label ?? ""}
                  onChange={(e) => updateStop(s.key, { label: e.target.value })}
                  placeholder="Etiqueta (ej: Cita médica)"
                  className="rounded-lg border px-3 py-2 text-sm"
                />
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-slate-600">Min en parada:</span>
                  <input
                    type="number"
                    min={0}
                    max={480}
                    value={s.durationMin}
                    onChange={(e) => updateStop(s.key, { durationMin: Number(e.target.value) })}
                    className="w-20 rounded-lg border px-3 py-2"
                  />
                </label>
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStops((p) => [...p, newStop("business")])}
              className="rounded-lg border px-3 py-1 text-sm hover:bg-slate-50"
            >
              + Negocio
            </button>
            <button
              type="button"
              onClick={() => setStops((p) => [...p, newStop("address")])}
              className="rounded-lg border px-3 py-1 text-sm hover:bg-slate-50"
            >
              + Dirección
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Optimizando..." : "Optimizar ruta"}
        </button>
      </form>

      <section className="rounded-xl border bg-white p-5">
        <h3 className="text-lg font-semibold">Resultado</h3>
        {!result ? (
          <p className="mt-3 text-sm text-slate-500">
            Configura tu origen y al menos una parada para ver el orden óptimo.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-brand-50 p-3">
                <div className="text-xs text-slate-500">Distancia</div>
                <div className="text-lg font-bold text-brand-700">
                  {result.totalKm.toFixed(1)} km
                </div>
              </div>
              <div className="rounded-lg bg-brand-50 p-3">
                <div className="text-xs text-slate-500">Viaje</div>
                <div className="text-lg font-bold text-brand-700">
                  {fmtMinutes(result.travelMinutes)}
                </div>
              </div>
              <div className="rounded-lg bg-brand-50 p-3">
                <div className="text-xs text-slate-500">Total</div>
                <div className="text-lg font-bold text-brand-700">
                  {fmtMinutes(result.totalMinutes)}
                </div>
              </div>
            </div>

            <ol className="space-y-2">
              {result.order.map((s, i) => (
                <li key={s.id + i} className="flex gap-3 rounded-lg border p-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <div className="text-sm">
                    <div className="font-medium">{s.name}</div>
                    {s.durationMin ? (
                      <div className="text-xs text-slate-500">~{s.durationMin} min en parada</div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>

            <a
              href={result.googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="block w-full rounded-lg bg-emerald-600 px-4 py-2 text-center font-semibold text-white hover:bg-emerald-700"
            >
              🗺️ Abrir ruta en Google Maps
            </a>

            {result.unresolved.length > 0 && (
              <p className="text-xs text-amber-700">
                ⚠️ No se pudieron geolocalizar: {result.unresolved.join(", ")}
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
