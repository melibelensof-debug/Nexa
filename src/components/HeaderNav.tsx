"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function HeaderNav() {
  const { data: session, status } = useSession();
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  const isAdmin =
    !!session?.user?.email && adminEmails.includes(session.user.email.toLowerCase());

  return (
    <nav className="flex items-center gap-4 text-sm text-slate-600">
      <Link href="/businesses" className="hover:text-brand-600">
        Negocios
      </Link>
      <Link href="/categories" className="hover:text-brand-600">
        Categorías
      </Link>
      <Link href="/route" className="hover:text-brand-600">
        Ruta
      </Link>
      {status === "authenticated" ? (
        <>
          <Link href="/dashboard" className="hover:text-brand-600">
            Mi panel
          </Link>
          {isAdmin && (
            <Link href="/admin/import" className="hover:text-brand-600">
              Admin
            </Link>
          )}
          <span className="hidden text-slate-400 sm:inline">
            {session.user?.name ?? session.user?.email}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded-lg border px-3 py-1 hover:bg-slate-50"
          >
            Salir
          </button>
        </>
      ) : (
        <>
          <Link href="/login" className="hover:text-brand-600">
            Ingresar
          </Link>
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
