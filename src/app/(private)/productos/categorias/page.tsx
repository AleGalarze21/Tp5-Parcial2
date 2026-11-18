import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryManager } from "@/components/category-manager";
import { getCurrentUser } from "@/lib/auth";
import { listCategories } from "@/lib/services/categories";

export default async function CategoriesPage() {
  const [user, categories] = await Promise.all([getCurrentUser(), listCategories()]);
  return <div className="space-y-6"><div><Link href="/productos"><Button variant="ghost" size="sm" className="mb-3 -ml-3"><ArrowLeft size={16}/>Volver a productos</Button></Link><p className="text-sm font-medium text-[var(--primary)]">CATÁLOGO</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Categorías</h1><p className="mt-2 text-sm text-[var(--muted)]">Organizá los productos por tipo.</p></div>{user?.role === "admin" ? <CategoryManager categories={categories}/> : <section className="rounded-2xl border border-[var(--border)] bg-white p-6"><div className="divide-y divide-[var(--border)]">{categories.map((category) => <div key={category.id} className="py-4 font-medium">{category.name}</div>)}</div></section>}</div>;
}
