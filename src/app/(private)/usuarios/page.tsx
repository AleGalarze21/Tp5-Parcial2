import { getCurrentUser } from "@/lib/auth";
import { UserManager } from "@/components/user-manager";
import { listUsers } from "@/lib/services/users";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; activo?: string; page?: string }> }) {
  const filters = await searchParams;
  const [current, allUsers] = await Promise.all([getCurrentUser(), listUsers({ q: filters.q, active: filters.activo })]);
  const pageSize = 10; const page = Math.min(Math.max(1, Number(filters.page ?? 1) || 1), Math.max(1, Math.ceil(allUsers.length / pageSize))); const users = allUsers.slice((page - 1) * pageSize, page * pageSize);
  return <div className="space-y-6"><div><p className="text-sm font-medium text-[var(--primary)]">ADMINISTRACIÓN</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Usuarios</h1><p className="mt-2 text-sm text-[var(--muted)]">Administrá accesos, roles y contraseñas.</p></div><UserManager users={users} currentUserId={current?.id ?? 0} query={filters.q ?? ""} active={filters.activo ?? "todos"} page={page} pageSize={pageSize} total={allUsers.length}/></div>;
}
