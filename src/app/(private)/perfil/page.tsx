import { getCurrentUser } from "@/lib/auth";
import { PasswordForm } from "@/components/password-form";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  return <div className="space-y-6"><div><p className="text-sm font-medium text-[var(--primary)]">TU CUENTA</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Mi perfil</h1><p className="mt-2 text-sm text-[var(--muted)]">{user?.name} · {user?.email}</p></div><PasswordForm/></div>;
}
