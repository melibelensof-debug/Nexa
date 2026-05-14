import { createClient } from "@/lib/supabase/server";

export async function requireAdmin(): Promise<
  { ok: true; email: string; userId: string } | { ok: false; status: number; message: string }
> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { ok: false, status: 401, message: "No autenticado" };
  }
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!admins.includes(user.email.toLowerCase())) {
    return { ok: false, status: 403, message: "No autorizado" };
  }
  return { ok: true, email: user.email, userId: user.id };
}
