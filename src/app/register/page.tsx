"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });

    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }

    // Si el proyecto requiere confirmación por email, no hay sesión todavía
    if (!data.session) {
      setInfo("Revisa tu email para confirmar la cuenta antes de ingresar.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-bold">Crear cuenta</h1>
      <form onSubmit={onSubmit} className="space-y-3 rounded-xl border bg-white p-6">
        <label className="block text-sm">
          <span className="text-slate-700">Nombre</span>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">Contraseña</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
          <span className="mt-1 block text-xs text-slate-500">Mínimo 6 caracteres</span>
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-emerald-700">{info}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Creando..." : "Crear cuenta"}
        </button>
      </form>
      <p className="text-sm text-slate-600">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-brand-600 hover:underline">
          Ingresa
        </Link>
      </p>
    </div>
  );
}
