import { getCurrentUser } from "@/lib/auth";
import { UserManager } from "@/components/user-manager";
import { listUsers } from "@/lib/services/users";

export default async function UsersPage() {
  const [current, users] = await Promise.all([getCurrentUser(), listUsers()]);
  return <div className="space-y-6"><div><p className="text-sm font-medium text-[var(--primary)]">ADMINISTRACIÓN</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Usuarios</h1><p className="mt-2 text-sm text-[var(--muted)]">Administrá accesos, roles y contraseñas.</p></div><UserManager users={users} currentUserId={current?.id ?? 0}/></div>;
}
