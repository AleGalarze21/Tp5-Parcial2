"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArrowDownToLine, ArrowUpFromLine, Boxes, Pencil, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { currency } from "@/lib/utils";
import { Pagination } from "@/components/pagination";

type Category = { id: number; name: string };
export type ProductRow = { id: number; code: string; description: string; categoryId: number; category: string; price: number; stock: number; minStock: number; belowMinimum: boolean; active: boolean };

export function ProductManager({ products, categories, canEdit, query, categoryId, lowStock, page, total, pageSize }: { products: ProductRow[]; categories: Category[]; canEdit: boolean; query: string; categoryId: string; lowStock: boolean; page: number; total: number; pageSize: number }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<"new" | "edit" | "stock" | null>(null);
  const [selected, setSelected] = useState<ProductRow | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  function open(kind: "new" | "edit" | "stock", product?: ProductRow) { setSelected(product ?? null); setError(""); setNotice(""); setDialog(kind); }
  async function submitProduct(form: FormData) {
    setBusy(true); setError("");
    const input = { code: form.get("code"), description: form.get("description"), categoryId: Number(form.get("categoryId")), price: Math.round(Number(form.get("price")) * 100), minStock: Number(form.get("minStock")), ...(dialog === "new" ? { initialStock: Number(form.get("initialStock")) } : {}) };
    const response = await fetch(dialog === "edit" && selected ? `/api/productos/${selected.id}` : "/api/productos", { method: dialog === "edit" ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    const payload = await response.json();
    setBusy(false);
    if (!response.ok) { setError(payload.error?.message ?? "No se pudo guardar el producto."); return; }
    setDialog(null); setNotice(dialog === "edit" ? "Producto actualizado." : "Producto creado."); router.refresh();
  }
  async function submitMovement(form: FormData) {
    if (!selected) return;
    setBusy(true); setError("");
    const response = await fetch(`/api/productos/${selected.id}/movimientos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: form.get("type"), quantity: Number(form.get("quantity")), reason: form.get("reason") }) });
    const payload = await response.json(); setBusy(false);
    if (!response.ok) { setError(payload.error?.message ?? "No se pudo registrar el movimiento."); return; }
    setDialog(null); setNotice("Movimiento de stock registrado."); router.refresh();
  }
  async function deactivate(product: ProductRow) {
    if (!window.confirm(`¿Dar de baja ${product.description}? El producto dejará de ofrecerse en ventas y conservará su historial.`)) return;
    const response = await fetch(`/api/productos/${product.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: false }) });
    if (!response.ok) { const payload = await response.json(); setError(payload.error?.message ?? "No se pudo dar de baja."); return; }
    setNotice("Producto dado de baja."); router.refresh();
  }

  return <div>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <form className="flex flex-wrap items-center gap-2" action="/productos"><span className="flex h-10 w-72 items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3"><Search size={17} className="text-slate-400"/><input name="q" defaultValue={query} placeholder="Buscar por código o descripción" className="w-full bg-transparent text-sm outline-none"/></span><select name="categoriaId" defaultValue={categoryId} className="h-10 rounded-lg border border-[var(--border)] bg-white px-3 text-sm"><option value="">Todas las categorías</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><label className="flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3 text-sm"><input type="checkbox" name="bajoMinimo" value="true" defaultChecked={lowStock}/>Bajo mínimo</label><Button variant="outline" size="sm">Buscar</Button></form>
      {canEdit && <Button onClick={() => open("new")}><Plus size={17}/>Nuevo producto</Button>}
    </div>
    {notice && <div role="status" className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}
    {error && !dialog && <div role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
      <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Producto</th><th className="px-4 py-4">Categoría</th><th className="px-4 py-4 text-right">Precio</th><th className="px-4 py-4 text-right">Existencia</th><th className="px-4 py-4">Estado</th><th className="px-4 py-4 text-right">Acciones</th></tr></thead><tbody className="divide-y divide-[var(--border)]">{products.map((product) => <tr key={product.id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><Link href={`/productos/${product.id}`} className="font-semibold text-slate-800 hover:text-[var(--primary)]">{product.description}</Link><span className="mt-1 block font-mono text-xs text-slate-500">{product.code}</span></td><td className="px-4 py-4 text-slate-600">{product.category}</td><td className="px-4 py-4 text-right font-medium tabular-nums">{currency(product.price)}</td><td className="px-4 py-4 text-right"><span className={`font-semibold tabular-nums ${product.belowMinimum ? "text-amber-700" : "text-slate-800"}`}>{product.stock}</span><span className="block text-xs text-slate-500">Mín. {product.minStock}</span></td><td className="px-4 py-4">{product.belowMinimum ? <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">Bajo mínimo</span> : <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">Disponible</span>}</td><td className="px-4 py-4"><div className="flex justify-end gap-1">{canEdit && <><Button variant="ghost" size="icon" title="Editar producto" onClick={() => open("edit", product)}><Pencil size={16}/></Button><Button variant="ghost" size="icon" title="Movimiento de stock" onClick={() => open("stock", product)}><ArrowUpFromLine size={16}/></Button><Button variant="ghost" size="icon" title="Dar de baja" onClick={() => deactivate(product)}><Archive size={16}/></Button></>}</div></td></tr>)}</tbody></table></div>
      {products.length === 0 && <div className="px-6 py-16 text-center"><Boxes className="mx-auto text-slate-300" size={34}/><p className="mt-3 font-semibold">No encontramos productos</p><p className="mt-1 text-sm text-[var(--muted)]">Probá cambiar los filtros de búsqueda.</p></div>}
    </div>
      <Pagination page={page} pageSize={pageSize} total={total} path="/productos" params={{ q: query, categoriaId: categoryId, bajoMinimo: lowStock ? "true" : undefined }}/>
    {dialog && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setDialog(null); }}><section role="dialog" aria-modal="true" aria-labelledby="dialog-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
      <div className="mb-5 flex items-start justify-between"><div><h2 id="dialog-title" className="text-xl font-semibold">{dialog === "new" ? "Nuevo producto" : dialog === "edit" ? "Editar producto" : "Movimiento de stock"}</h2><p className="mt-1 text-sm text-[var(--muted)]">{dialog === "stock" ? selected?.description : "Completá los datos del catálogo."}</p></div><Button variant="ghost" size="icon" onClick={() => setDialog(null)}><X size={18}/></Button></div>
      {dialog === "stock" ? <form action={submitMovement} className="space-y-4"><label className="block text-sm font-medium">Tipo de movimiento<select name="type" className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] px-3"><option value="ingreso">Ingreso</option><option value="egreso">Egreso</option></select></label><label className="block text-sm font-medium">Cantidad<input name="quantity" type="number" min="1" required className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] px-3"/></label><label className="block text-sm font-medium">Motivo<select name="reason" required className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] px-3"><option value="Reposición">Reposición</option><option value="Ajuste de inventario">Ajuste de inventario</option><option value="Rotura">Rotura</option><option value="Vencimiento">Vencimiento</option><option value="Uso interno">Uso interno</option></select></label>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setDialog(null)}>Cancelar</Button><Button disabled={busy}><ArrowDownToLine size={16}/>{busy ? "Guardando…" : "Registrar"}</Button></div></form> : <form action={submitProduct} className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Código<input name="code" defaultValue={selected?.code} required className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] px-3"/></label><label className="text-sm font-medium">Categoría<select name="categoryId" defaultValue={selected?.categoryId ?? ""} required className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] px-3"><option value="" disabled>Elegir categoría</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="text-sm font-medium sm:col-span-2">Descripción<input name="description" defaultValue={selected?.description} required className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] px-3"/></label><label className="text-sm font-medium">Precio (pesos)<input name="price" type="number" min="0" step="0.01" defaultValue={selected ? (selected.price / 100).toFixed(2) : ""} required className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] px-3"/></label><label className="text-sm font-medium">Stock mínimo<input name="minStock" type="number" min="0" defaultValue={selected?.minStock ?? 0} required className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] px-3"/></label>{dialog === "new" && <label className="text-sm font-medium sm:col-span-2">Stock inicial<input name="initialStock" type="number" min="0" defaultValue={0} className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] px-3"/><small className="mt-1 block font-normal text-[var(--muted)]">Se registra como ingreso de stock inicial.</small></label>}{error && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{error}</p>}<div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="outline" onClick={() => setDialog(null)}>Cancelar</Button><Button disabled={busy}>{busy ? "Guardando…" : "Guardar producto"}</Button></div></form>}
    </section></div>}
  </div>;
}
