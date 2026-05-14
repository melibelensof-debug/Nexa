import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireAdmin(): Promise<
  { ok: true; email: string; userId: string } | { ok: false; status: number; message: string }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return { ok: false, status: 401, message: "No autenticado" };
  }
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!admins.includes(session.user.email.toLowerCase())) {
    return { ok: false, status: 403, message: "No autorizado" };
  }
  return { ok: true, email: session.user.email, userId: session.user.id };
}

export async function isAdmin(): Promise<boolean> {
  const r = await requireAdmin();
  return r.ok;
}
