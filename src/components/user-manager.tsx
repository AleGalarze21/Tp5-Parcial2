"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Pencil, Plus, UserRoundCog, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/pagination";
import { userCreateSchema, userPatchSchema } from "@/lib/schemas";
import { FieldError, issuesToFieldErrors, serverFieldErrors, type FieldErrors } from "@/components/ui/field-error";

type User = { id: number; name: string; email: string; role: "admin" | "vendedor"; active: boolean };
export function UserManager({ users, currentUserId, query, active, page, total, pageSize }: { users: User[]; currentUserId: number; query: string; active: string; page: number; total: number; pageSize: number }) {
  const router = useRouter(); const [editing, setEditing] = useState<User | null>(null); const [modal, setModal] = useState(false);
  const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [temporaryPassword, setTemporaryPassword] = useState(""); const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  function open(user?: User) { setEditing(user ?? null); setError(""); setFieldErrors({}); setModal(true); }
  async function save(form: FormData) {
    setBusy(true); setError(""); setFieldErrors({});
    const data = { name: form.get("name"), email: form.get("email"), role: form.get("role"), ...(!editing ? { password: form.get("password") } : {}) };
    const validation = (editing ? userPatchSchema : userCreateSchema).safeParse(data);
    if (!validation.success) { setBusy(false); setFieldErrors(issuesToFieldErrors(validation.error.issues)); return; }
    const response = await fetch(editing ? `/api/usuarios/${editing.id}` : "/api/usuarios", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(validation.data) });
    const payload = await response.json(); setBusy(false);
    if (!response.ok) { const details = serverFieldErrors(payload); if (Object.keys(details).length) setFieldErrors(details); else setError(payload.error?.message ?? "No se pudo guardar el usuario."); return; }
    setModal(false); setNotice(editing ? "Usuario actualizado." : "Usuario creado."); router.refresh();
  }
  async function changeActive(user: User) {
    const active = !user.active;
    if (!active && !window.confirm(`¿Desactivar a ${user.name}? No podrá volver a iniciar sesión.`)) return;
    const response = await fetch(`/api/usuarios/${user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active }) });
    const payload = await response.json(); if (!response.ok) { setError(payload.error?.message ?? "No se pudo actualizar el usuario."); return; }
    setNotice(active ? "Usuario activado." : "Usuario desactivado."); router.refresh();
  }
  async function reset(user: User) {
    if (!window.confirm(`¿Generar una contraseña temporal para ${user.name}?`)) return;
    const response = await fetch(`/api/usuarios/${user.id}/reset-password`, { method: "POST" }); const payload = await response.json();
    if (!response.ok) { setError(payload.error?.message ?? "No se pudo restablecer la contraseña."); return; }
    setTemporaryPassword(`${user.name}: ${payload.passwordTemporal}`); setNotice("La contraseña temporal se muestra una sola vez.");
  }
  return <div>{notice && <div role="status" className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}{temporaryPassword && <strong className="ml-2 select-all font-mono">{temporaryPassword}</strong>}</div>}{error && !modal && <div role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><form action="/usuarios" className="flex gap-2"><input name="q" defaultValue={query} placeholder="Buscar usuario" className="h-10 w-64 rounded-lg border border-[var(--border)] bg-white px-3 text-sm"/><select name="activo" defaultValue={active} className="h-10 rounded-lg border border-[var(--border)] bg-white px-3 text-sm"><option value="todos">Todos</option><option value="true">Activos</option><option value="false">Inactivos</option></select><Button variant="outline" size="sm">Filtrar</Button></form><Button onClick={() => open()}><Plus size={17}/>Nuevo usuario</Button></div><section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Usuario</th><th className="px-4 py-4">Rol</th><th className="px-4 py-4">Estado</th><th className="px-5 py-4 text-right">Acciones</th></tr></thead><tbody className="divide-y divide-[var(--border)]">{users.map((user) => <tr key={user.id}><td className="px-5 py-4"><strong className="block">{user.name}</strong><small className="text-[var(--muted)]">{user.email}</small></td><td className="px-4 py-4 capitalize">{user.role}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{user.active ? "Activo" : "Inactivo"}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" title="Editar" onClick={() => open(user)}><Pencil size={16}/></Button><Button variant="ghost" size="icon" title="Restablecer contraseña" onClick={() => reset(user)}><KeyRound size={16}/></Button><Button variant="ghost" size="sm" disabled={user.id === currentUserId} onClick={() => changeActive(user)}>{user.active ? "Desactivar" : "Activar"}</Button></div></td></tr>)}</tbody></table></div>{users.length === 0 && <p className="p-10 text-center text-sm text-[var(--muted)]">No hay usuarios con esos filtros.</p>}<Pagination page={page} pageSize={pageSize} total={total} path="/usuarios" params={{ q: query, activo: active }}/></section>
    {modal && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(false); }}><section role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex justify-between"><div><h2 className="text-xl font-semibold">{editing ? "Editar usuario" : "Nuevo usuario"}</h2><p className="mt-1 text-sm text-[var(--muted)]">Definí el acceso y el rol.</p></div><Button variant="ghost" size="icon" onClick={() => setModal(false)}><X size={18}/></Button></div><form action={save} className="space-y-4"><label className="block text-sm font-medium">Nombre<input name="name" defaultValue={editing?.name} required aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? "name-error" : undefined} className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] px-3"/><FieldError name="name" errors={fieldErrors}/></label><label className="block text-sm font-medium">Email<input name="email" type="email" defaultValue={editing?.email} required aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "email-error" : undefined} className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] px-3"/><FieldError name="email" errors={fieldErrors}/></label><label className="block text-sm font-medium">Rol<select name="role" defaultValue={editing?.role ?? "vendedor"} aria-invalid={Boolean(fieldErrors.role)} aria-describedby={fieldErrors.role ? "role-error" : undefined} className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] px-3"><option value="vendedor">Vendedor</option><option value="admin">Administrador</option></select><FieldError name="role" errors={fieldErrors}/></label>{!editing && <label className="block text-sm font-medium">Contraseña temporal<input name="password" type="password" minLength={8} required aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? "password-error" : undefined} className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] px-3"/><FieldError name="password" errors={fieldErrors}/><small className="mt-1 block font-normal text-[var(--muted)]">Mínimo 8 caracteres.</small></label>}{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setModal(false)}>Cancelar</Button><Button disabled={busy}><UserRoundCog size={16}/>{busy ? "Guardando…" : "Guardar"}</Button></div></form></section></div>}
  </div>;
}
