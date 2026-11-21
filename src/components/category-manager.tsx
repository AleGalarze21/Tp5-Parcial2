"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Pencil, Plus, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, issuesToFieldErrors, type FieldErrors } from "@/components/ui/field-error";
import { categoryCreateSchema, categoryPatchSchema } from "@/lib/schemas";

type Category = { id: number; name: string };
export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setFieldErrors({});
    const validation = (editing ? categoryPatchSchema : categoryCreateSchema).safeParse({ name });
    if (!validation.success) { setBusy(false); setFieldErrors(issuesToFieldErrors(validation.error.issues)); return; }
    const response = await fetch(editing ? `/api/categorias/${editing.id}` : "/api/categorias", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(validation.data) });
    const payload = await response.json(); setBusy(false);
    if (!response.ok) { setError(payload.error?.message ?? "No se pudo guardar la categoría."); return; }
    setName(""); setEditing(null); setNotice(editing ? "Categoría actualizada." : "Categoría creada."); router.refresh();
  }
  async function deactivate(category: Category) {
    if (!window.confirm(`¿Dar de baja la categoría ${category.name}?`)) return;
    const response = await fetch(`/api/categorias/${category.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: false }) });
    const payload = await response.json(); if (!response.ok) { setError(payload.error?.message ?? "No se pudo dar de baja."); return; }
    setNotice("Categoría desactivada."); router.refresh();
  }
  return <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
    <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white"><div className="border-b border-[var(--border)] px-5 py-4"><h2 className="font-semibold">Categorías activas</h2><p className="mt-1 text-sm text-[var(--muted)]">Las categorías con productos activos no se pueden desactivar.</p></div><div className="divide-y divide-[var(--border)]">{categories.map((category) => <div key={category.id} className="flex items-center justify-between px-5 py-4"><div><p className="font-medium">{category.name}</p><p className="mt-1 text-xs text-[var(--muted)]">Categoría de productos</p></div><div className="flex gap-1"><Button variant="ghost" size="icon" title="Editar" onClick={() => { setEditing(category); setName(category.name); setError(""); setFieldErrors({}); }}><Pencil size={16}/></Button><Button variant="ghost" size="icon" title="Desactivar" onClick={() => deactivate(category)}><Archive size={16}/></Button></div></div>)}{categories.length === 0 && <div className="px-6 py-14 text-center"><Tags className="mx-auto text-slate-300"/><p className="mt-3 text-sm text-[var(--muted)]">Todavía no hay categorías.</p></div>}</div></section>
    <section className="h-fit rounded-2xl border border-[var(--border)] bg-white p-5"><h2 className="font-semibold">{editing ? "Editar categoría" : "Agregar categoría"}</h2><form onSubmit={save} className="mt-4 space-y-4"><label className="block text-sm font-medium">Nombre<input name="name" autoFocus={Boolean(editing)} value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} required aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? "name-error" : undefined} className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] px-3" placeholder="Ej.: Placas de video"/><FieldError name="name" errors={fieldErrors}/></label>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}{notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}<div className="flex gap-2"><Button disabled={busy}><Plus size={16}/>{busy ? "Guardando…" : editing ? "Guardar" : "Agregar"}</Button>{editing && <Button type="button" variant="outline" onClick={() => { setEditing(null); setName(""); setFieldErrors({}); }}>Cancelar</Button>}</div></form></section>
  </div>;
}
