"use client";

import { useState } from "react";

type Option = { slug: string; name: string };

type ImportResult = { created: number; updated: number; total: number };

function ResultBox({ result, error }: { result: ImportResult | null; error: string | null }) {
  if (error) return <p className="mt-3 text-sm text-red-600">{error}</p>;
  if (!result) return null;
  return (
    <p className="mt-3 text-sm text-emerald-700">
      ✅ Total: {result.total} · Creados: {result.created} · Actualizados: {result.updated}
    </p>
  );
}

function CategoryRegionFields({
  categories,
  regions,
}: {
  categories: Option[];
  regions: Option[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block text-sm">
        <span className="text-slate-700">Categoría</span>
        <select
          name="categorySlug"
          required
          defaultValue=""
          className="mt-1 w-full rounded-lg border px-3 py-2"
        >
          <option value="" disabled>Selecciona...</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="text-slate-700">Región</span>
        <select
          name="regionSlug"
          required
          defaultValue=""
          className="mt-1 w-full rounded-lg border px-3 py-2"
        >
          <option value="" disabled>Selecciona...</option>
          {regions.map((r) => (
            <option key={r.slug} value={r.slug}>{r.name}</option>
          ))}
        </select>
      </label>
    </div>
  );
}

function ImportPanel({
  title,
  endpoint,
  categories,
  regions,
  description,
  buildPayload,
  children,
}: {
  title: string;
  endpoint: string;
  categories: Option[];
  regions: Option[];
  description: string;
  buildPayload: (form: FormData) => Record<string, unknown>;
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      categorySlug: fd.get("categorySlug"),
      regionSlug: fd.get("regionSlug"),
      ...buildPayload(fd),
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? `Error ${res.status}`);
      return;
    }
    setResult(data);
  }

  return (
    <section className="rounded-xl border bg-white p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <CategoryRegionFields categories={categories} regions={regions} />
        {children}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Importando..." : "Importar"}
        </button>
        <ResultBox result={result} error={error} />
      </form>
    </section>
  );
}

export function ImportPanels({
  categories,
  regions,
}: {
  categories: Option[];
  regions: Option[];
}) {
  const [backfillMsg, setBackfillMsg] = useState<string | null>(null);
  const [backfilling, setBackfilling] = useState(false);

  async function backfillGeo() {
    setBackfilling(true);
    setBackfillMsg(null);
    const res = await fetch("/api/geocode/backfill", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBackfilling(false);
    if (!res.ok) {
      setBackfillMsg(`❌ ${data.error ?? "Error"}`);
      return;
    }
    setBackfillMsg(
      `✅ Procesados: ${data.processed} · Actualizados: ${data.updated} · Sin resolver: ${data.failed}`
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ImportPanel
        title="Google Maps"
        endpoint="/api/import/google-maps"
        description='Términos de búsqueda como "panaderia salta argentina". Hasta 200 lugares por término.'
        categories={categories}
        regions={regions}
        buildPayload={(fd) => ({
          searchTerms: String(fd.get("searchTerms") ?? "")
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          maxItems: Number(fd.get("maxItems")) || 20,
        })}
      >
        <label className="block text-sm">
          <span className="text-slate-700">Términos (uno por línea)</span>
          <textarea
            name="searchTerms"
            required
            rows={3}
            className="mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm"
            placeholder={`panaderia cordoba argentina\nveterinaria mendoza`}
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">Máx. lugares por término</span>
          <input
            type="number"
            name="maxItems"
            min={1}
            max={200}
            defaultValue={20}
            className="mt-1 w-32 rounded-lg border px-3 py-2"
          />
        </label>
      </ImportPanel>

      <ImportPanel
        title="Instagram"
        endpoint="/api/import/instagram"
        description="Usuarios o URLs de perfil (@usuario o https://instagram.com/usuario)."
        categories={categories}
        regions={regions}
        buildPayload={(fd) => ({
          usernames: String(fd.get("usernames") ?? "")
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        })}
      >
        <label className="block text-sm">
          <span className="text-slate-700">Usuarios (uno por línea)</span>
          <textarea
            name="usernames"
            required
            rows={4}
            className="mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm"
            placeholder={`@nombredenegocio\nhttps://instagram.com/otronegocio`}
          />
        </label>
      </ImportPanel>

      <ImportPanel
        title="Facebook"
        endpoint="/api/import/facebook"
        description="Páginas de Facebook (URL o handle)."
        categories={categories}
        regions={regions}
        buildPayload={(fd) => ({
          pages: String(fd.get("pages") ?? "")
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        })}
      >
        <label className="block text-sm">
          <span className="text-slate-700">Páginas (una por línea)</span>
          <textarea
            name="pages"
            required
            rows={4}
            className="mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm"
            placeholder={`nombredenegocio\nhttps://facebook.com/otronegocio`}
          />
        </label>
      </ImportPanel>

      <section className="rounded-xl border bg-white p-5">
        <h2 className="text-lg font-semibold">Geocodificación</h2>
        <p className="mt-1 text-sm text-slate-500">
          Calcula coordenadas (lat/lon) para los negocios con dirección pero sin geolocalización.
          Usa Nominatim (OSM). Procesa lotes de 30 por click.
        </p>
        <button
          onClick={backfillGeo}
          disabled={backfilling}
          className="mt-4 rounded-lg bg-slate-800 px-4 py-2 font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
        >
          {backfilling ? "Procesando..." : "Geocodificar pendientes"}
        </button>
        {backfillMsg && <p className="mt-3 text-sm">{backfillMsg}</p>}
      </section>
    </div>
  );
}
