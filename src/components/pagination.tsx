import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ page, pageSize, total, path, params = {} }: { page: number; pageSize: number; total: number; path: string; params?: Record<string, string | undefined> }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages < 2) return null;
  function href(target: number) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
    query.set("page", String(target));
    return `${path}?${query.toString()}`;
  }
  return <nav aria-label="Paginación" className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-5 py-4 text-sm"><span className="text-[var(--muted)]">Página {page} de {pages} · {total} resultados</span><div className="flex gap-2">{page > 1 ? <Link href={href(page - 1)} className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--border)] px-3 hover:bg-slate-50"><ChevronLeft size={16}/>Anterior</Link> : <span className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--border)] px-3 text-slate-400"><ChevronLeft size={16}/>Anterior</span>}{page < pages ? <Link href={href(page + 1)} className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--border)] px-3 hover:bg-slate-50">Siguiente<ChevronRight size={16}/></Link> : <span className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--border)] px-3 text-slate-400">Siguiente<ChevronRight size={16}/></span>}</div></nav>;
}
