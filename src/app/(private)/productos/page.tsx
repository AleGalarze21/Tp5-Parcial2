import Link from "next/link";
import { ChevronRight, Tags } from "lucide-react";
import { ProductManager } from "@/components/product-manager";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { listProducts } from "@/lib/services/products";
import { asc, eq } from "drizzle-orm";

type Props = { searchParams: Promise<{ q?: string; categoriaId?: string; bajoMinimo?: string; page?: string }> };
export default async function ProductsPage({ searchParams }: Props) {
  const filters = await searchParams;
  const [user, allProducts, categoryList] = await Promise.all([
    getCurrentUser(),
    listProducts({ q: filters.q, categoryId: filters.categoriaId, belowMinimum: filters.bajoMinimo === "true" }),
    db.select({ id: categories.id, name: categories.name }).from(categories).where(eq(categories.active, true)).orderBy(asc(categories.name)),
  ]);
  const pageSize = 10; const page = Math.min(Math.max(1, Number(filters.page ?? 1) || 1), Math.max(1, Math.ceil(allProducts.length / pageSize))); const productList = allProducts.slice((page - 1) * pageSize, page * pageSize);
  return <div className="space-y-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-[var(--primary)]">CATÁLOGO</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Productos</h1><p className="mt-2 text-sm text-[var(--muted)]">Administrá el catálogo y mantené el stock al día.</p></div><Link href="/productos/categorias" className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-4 text-sm font-semibold hover:bg-slate-50"><Tags size={16}/>Categorías<ChevronRight size={16}/></Link></div><ProductManager products={productList} categories={categoryList} canEdit={user?.role === "admin"} query={filters.q ?? ""} categoryId={filters.categoriaId ?? ""} lowStock={filters.bajoMinimo === "true"} page={page} pageSize={pageSize} total={allProducts.length}/></div>;
}
