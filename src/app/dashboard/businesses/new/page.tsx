import { createClient } from "@/lib/supabase/server";
import { NewBusinessForm } from "./NewBusinessForm";

export const dynamic = "force-dynamic";

export default async function NewBusinessPage() {
  const supabase = createClient();

  const [{ data: categories }, { data: regions }] = await Promise.all([
    supabase.from("categories").select("id, name, slug").order("name"),
    supabase.from("regions").select("id, name, slug").order("name"),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Registrar negocio</h1>
      <NewBusinessForm categories={categories ?? []} regions={regions ?? []} />
    </div>
  );
}
