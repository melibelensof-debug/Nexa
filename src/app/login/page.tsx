"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirectedFrom") ?? "/dashboard";
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (authError) {
      setError("Email o contraseña incorrectos");
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border bg-white p-6">
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
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {loading ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-bold">Ingresar</h1>
      <Suspense fallback={<div className="rounded-xl border bg-white p-6">Cargando...</div>}>
        <LoginForm />
      </Suspense>
      <p className="text-sm text-slate-600">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-brand-600 hover:underline">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
