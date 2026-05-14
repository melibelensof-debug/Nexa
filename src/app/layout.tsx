import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { HeaderNav } from "@/components/HeaderNav";

export const metadata: Metadata = {
  title: "Nexa — Directorio de pymes",
  description:
    "Conecta pymes de distintas regiones. Encuentra negocios por categoría de forma rápida y organizada.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-xl font-bold text-brand-600">
              Nexa
            </Link>
            <HeaderNav />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="border-t bg-white">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-500">
            © {new Date().getFullYear()} Nexa — Conectando pymes
          </div>
        </footer>
      </body>
    </html>
  );
}
