import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewBusinessForm } from "./NewBusinessForm";

export const dynamic = "force-dynamic";

export default async function NewBusinessPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard/businesses/new");

  const [categories, regions] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.region.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Registrar negocio</h1>
      <NewBusinessForm categories={categories} regions={regions} />
    </div>
  );
}
