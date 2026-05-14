"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Option = { id: string; name: string };

export function NewBusinessForm({
  categories,
  regions,
}: {
  categories: Option[];
  regions: Option[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());

    const res = await fetch("/api/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo crear el negocio");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  const inputClass = "mt-1 w-full rounded-lg border px-3 py-2";

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border bg-white p-6">
      <label className="block text-sm">
        <span className="text-slate-700">Nombre *</span>
        <input name="name" required className={inputClass} />
      </label>
      <label className="block text-sm">
        <span className="text-slate-700">Descripción *</span>
        <textarea
          name="description"
          required
          rows={4}
          className={inputClass}
          placeholder="Cuenta brevemente qué hace tu pyme"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-slate-700">Categoría *</span>
          <select name="categoryId" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Selecciona...
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">Región *</span>
          <select name="regionId" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Selecciona...
            </option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-sm">
        <span className="text-slate-700">Dirección</span>
        <input name="address" className={inputClass} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-slate-700">Email de contacto</span>
          <input name="email" type="email" className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">Teléfono</span>
          <input name="phone" className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">Sitio web</span>
          <input name="website" type="url" placeholder="https://..." className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">WhatsApp</span>
          <input name="whatsapp" placeholder="+5491111111111" className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">Instagram</span>
          <input name="instagram" placeholder="usuario" className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">Facebook</span>
          <input name="facebook" placeholder="usuario" className={inputClass} />
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {loading ? "Guardando..." : "Crear negocio"}
      </button>
    </form>
  );
}
