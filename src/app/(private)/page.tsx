import Link from "next/link";
import { ArrowUpRight, Boxes, CircleDollarSign, ReceiptText, Users } from "lucide-react";
import { count, eq, gte, sql, sum } from "drizzle-orm";
import { db } from "@/lib/db";
import { accountMovements, customers, invoices, products } from "@/lib/db/schema";
import { currency } from "@/lib/utils";

export default async function DashboardPage() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [todaySales] = await db.select({ count: count(), total: sum(invoices.total) }).from(invoices).where(gte(invoices.date, start));
  const [productCount] = await db.select({ count: count() }).from(products).where(eq(products.active, true));
  const [customerCount] = await db.select({ count: count() }).from(customers).where(eq(customers.active, true));
  const [lowStock] = await db.select({ count: count() }).from(products).where(sql`${products.active} = 1 AND ${products.stock} <= ${products.minStock}`);
  const [debt] = await db.select({ total: sql<number>`coalesce(sum(case when ${accountMovements.type} = 'debito' then ${accountMovements.amount} else -${accountMovements.amount} end), 0)` }).from(accountMovements);
  const metricCards = [
    { title: "Ventas de hoy", value: String(todaySales.count), detail: currency(Number(todaySales.total ?? 0)), icon: ReceiptText, tone: "teal" },
    { title: "Productos activos", value: String(productCount.count), detail: `${lowStock.count} con stock bajo`, icon: Boxes, tone: "amber" },
    { title: "Clientes", value: String(customerCount.count), detail: "Registrados en el sistema", icon: Users, tone: "blue" },
    { title: "Deuda en cuenta", value: currency(Number(debt.total ?? 0)), detail: "Saldo de cuentas corrientes", icon: CircleDollarSign, tone: "purple" },
  ];
  return <div className="space-y-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-[var(--primary)]">RESUMEN DEL COMERCIO</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Inicio</h1><p className="mt-2 text-sm text-[var(--muted)]">Una vista rápida de la actividad de hoy.</p></div><p className="text-sm text-[var(--muted)]">{new Intl.DateTimeFormat("es-AR", { dateStyle: "full", timeZone: "America/Argentina/Buenos_Aires" }).format(now)}</p></div>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metricCards.map(({ title, value, detail, icon: Icon, tone }) => <article key={title} className="rounded-2xl border border-[var(--border)] bg-white p-5"><div className="flex items-start justify-between"><span className="text-sm font-medium text-[var(--muted)]">{title}</span><span className={`grid size-10 place-items-center rounded-xl bg-${tone}-50 text-${tone}-700`}><Icon size={19}/></span></div><p className="mt-5 text-2xl font-semibold tabular-nums">{value}</p><p className="mt-1 text-xs text-[var(--muted)]">{detail}</p></article>)}</section>
    <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      <article className="rounded-2xl border border-[var(--border)] bg-white p-6"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Empezá a operar</h2><p className="mt-1 text-sm text-[var(--muted)]">Accesos directos para las tareas frecuentes.</p></div><ArrowUpRight className="text-[var(--muted)]" size={20}/></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><Link href="/ventas/nueva" className="rounded-xl border border-[var(--border)] p-4 hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]"><ReceiptText className="text-[var(--primary)]"/><strong className="mt-3 block text-sm">Nueva venta</strong><span className="mt-1 block text-xs text-[var(--muted)]">Registrar una operación</span></Link><Link href="/productos" className="rounded-xl border border-[var(--border)] p-4 hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]"><Boxes className="text-[var(--primary)]"/><strong className="mt-3 block text-sm">Ver productos</strong><span className="mt-1 block text-xs text-[var(--muted)]">Consultar catálogo y stock</span></Link><Link href="/clientes" className="rounded-xl border border-[var(--border)] p-4 hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]"><Users className="text-[var(--primary)]"/><strong className="mt-3 block text-sm">Buscar clientes</strong><span className="mt-1 block text-xs text-[var(--muted)]">Consultar saldos y actividad</span></Link><Link href="/ventas" className="rounded-xl border border-[var(--border)] p-4 hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]"><CircleDollarSign className="text-[var(--primary)]"/><strong className="mt-3 block text-sm">Facturas</strong><span className="mt-1 block text-xs text-[var(--muted)]">Revisar operaciones recientes</span></Link></div></article>
      <article className="rounded-2xl border border-[var(--border)] bg-white p-6"><h2 className="text-lg font-semibold">Atención de stock</h2><p className="mt-1 text-sm text-[var(--muted)]">Productos que alcanzaron el mínimo configurado.</p><div className="mt-8 flex items-center gap-4 rounded-xl bg-amber-50 p-4"><span className="grid size-12 place-items-center rounded-xl bg-white text-amber-700"><Boxes/></span><div><p className="text-2xl font-semibold">{lowStock.count}</p><p className="text-xs text-amber-800">Requieren revisión</p></div></div><Link href="/productos?bajoMinimo=true" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">Ver productos con stock bajo <ArrowUpRight size={16}/></Link></article>
    </section>
  </div>;
}
