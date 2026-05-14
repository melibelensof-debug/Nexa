import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard");

  const businesses = await prisma.business.findMany({
    where: { ownerId: session.user.id },
    include: { category: true, region: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mi panel</h1>
          <p className="text-sm text-slate-500">
            Bienvenido{session.user.name ? `, ${session.user.name}` : ""}.
          </p>
        </div>
        <Link
          href="/dashboard/businesses/new"
          className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700"
        >
          + Nuevo negocio
        </Link>
      </div>

      {businesses.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center">
          <p className="text-slate-600">Aún no has registrado ningún negocio.</p>
          <Link
            href="/dashboard/businesses/new"
            className="mt-4 inline-block text-brand-600 hover:underline"
          >
            Registrar mi primer negocio
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {businesses.map((b) => (
            <li
              key={b.id}
              className="rounded-xl border bg-white p-5 hover:border-brand-500"
            >
              <div className="text-xs uppercase tracking-wide text-brand-600">
                {b.category.name} · {b.region.name}
              </div>
              <div className="mt-1 text-lg font-semibold">{b.name}</div>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                {b.description}
              </p>
              <div className="mt-3 flex gap-3 text-sm">
                <Link
                  href={`/businesses/${b.slug}`}
                  className="text-brand-600 hover:underline"
                >
                  Ver
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
