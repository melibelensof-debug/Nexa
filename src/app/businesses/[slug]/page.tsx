import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function BusinessDetail({
  params,
}: {
  params: { slug: string };
}) {
  const business = await prisma.business.findUnique({
    where: { slug: params.slug },
    include: { category: true, region: true },
  });

  if (!business) notFound();

  const links: { label: string; href: string }[] = [];
  if (business.website) links.push({ label: "Sitio web", href: business.website });
  if (business.instagram)
    links.push({
      label: "Instagram",
      href: `https://instagram.com/${business.instagram}`,
    });
  if (business.facebook)
    links.push({
      label: "Facebook",
      href: business.facebook.startsWith("http")
        ? business.facebook
        : `https://facebook.com/${business.facebook}`,
    });
  if (business.whatsapp)
    links.push({
      label: "WhatsApp",
      href: `https://wa.me/${business.whatsapp.replace(/\D/g, "")}`,
    });
  if (business.email)
    links.push({ label: "Email", href: `mailto:${business.email}` });

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/businesses" className="text-sm text-brand-600 hover:underline">
          ← Volver al directorio
        </Link>
      </div>

      {business.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={business.imageUrl}
          alt={business.name}
          className="h-56 w-full rounded-xl object-cover"
        />
      )}

      <header>
        <div className="text-xs uppercase tracking-wide text-brand-600">
          {business.category.name} · {business.region.name}
        </div>
        <h1 className="mt-1 text-3xl font-bold">{business.name}</h1>
        {business.rating != null && (
          <div className="mt-1 text-sm text-amber-600">
            ⭐ {business.rating.toFixed(1)}
            {business.reviewsCount ? ` · ${business.reviewsCount} reseñas` : ""}
          </div>
        )}
      </header>

      <p className="text-slate-700">{business.description}</p>

      {business.address && (
        <p className="text-sm text-slate-500">📍 {business.address}</p>
      )}

      {links.length > 0 && (
        <section className="rounded-xl border bg-white p-5">
          <h2 className="text-sm font-semibold uppercase text-slate-500">
            Contacto
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {links.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700 hover:bg-brand-100"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link
        href={`/route?businessId=${business.id}`}
        className="inline-block rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
      >
        ➕ Agregar a mi ruta
      </Link>
    </article>
  );
}
