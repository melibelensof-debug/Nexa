"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export function HeaderNav() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active) return;
      setEmail(user?.email ?? null);
      setName(user?.user_metadata?.full_name ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
      setName(session?.user?.user_metadata?.full_name ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  const isAdmin = !!email && adminEmails.includes(email.toLowerCase());

  return (
    <nav className="flex items-center gap-4 text-sm text-slate-600">
      <Link href="/businesses" className="hover:text-brand-600">Negocios</Link>
      <Link href="/categories" className="hover:text-brand-600">Categorías</Link>
      <Link href="/route" className="hover:text-brand-600">Ruta</Link>
      {email ? (
        <>
          <Link href="/dashboard" className="hover:text-brand-600">Mi panel</Link>
          {isAdmin && (
            <Link href="/admin/import" className="hover:text-brand-600">Admin</Link>
          )}
          <span className="hidden text-slate-400 sm:inline">{name ?? email}</span>
          <button
            onClick={signOut}
            className="rounded-lg border px-3 py-1 hover:bg-slate-50"
          >
            Salir
          </button>
        </>
      ) : (
        <>
          <Link href="/login" className="hover:text-brand-600">Ingresar</Link>
          <Link
            href="/register"
            className="rounded-lg bg-brand-600 px-3 py-1 font-semibold text-white hover:bg-brand-700"
          >
            Registrarme
          </Link>
        </>
      )}
    </nav>
  );
}
