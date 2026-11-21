import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { accountMovements, invoiceItems, invoices, products } from "@/lib/db/schema";
import { argentinaDateKey } from "@/lib/utils";

export async function getDashboard() {
  await requireUser();
  const todayKey = argentinaDateKey(new Date());
  const monthKey = todayKey.slice(0, 7);
  const todayStart = new Date(`${todayKey}T00:00:00-03:00`);
  const monthStart = new Date(`${monthKey}-01T00:00:00-03:00`);
  const chartStartKey = (() => { const d = new Date(`${todayKey}T00:00:00-03:00`); d.setDate(d.getDate() - 29); return argentinaDateKey(d); })();
  const chartStart = new Date(`${chartStartKey}T00:00:00-03:00`);
  const [todayRows, monthRows, recentInvoices, [debt], [low], bestSellers] = await Promise.all([
    db.select({ total: count(), amount: sql<number>`coalesce(sum(${invoices.total}), 0)` }).from(invoices).where(and(eq(invoices.status, "emitida"), gte(invoices.date, todayStart))),
    db.select({ total: count(), amount: sql<number>`coalesce(sum(${invoices.total}), 0)` }).from(invoices).where(and(eq(invoices.status, "emitida"), gte(invoices.date, monthStart))),
    db.select({ date: invoices.date, total: invoices.total }).from(invoices).where(and(eq(invoices.status, "emitida"), gte(invoices.date, chartStart))),
    db.select({ amount: sql<number>`coalesce(sum(case when ${accountMovements.type} = 'debito' then ${accountMovements.amount} else -${accountMovements.amount} end), 0)` }).from(accountMovements),
    db.select({ total: count() }).from(products).where(and(eq(products.active, true), lte(products.stock, products.minStock))),
    db.select({ productId: invoiceItems.productId, code: invoiceItems.code, description: invoiceItems.description, units: sql<number>`sum(${invoiceItems.quantity})`, amount: sql<number>`sum(${invoiceItems.subtotal})` }).from(invoiceItems).innerJoin(invoices, eq(invoiceItems.invoiceId, invoices.id)).where(and(eq(invoices.status, "emitida"), gte(invoices.date, monthStart))).groupBy(invoiceItems.productId).orderBy(sql`sum(${invoiceItems.quantity}) desc`).limit(5),
  ]);
  const daily = new Map<string, number>();
  for (const invoice of recentInvoices) { const key = argentinaDateKey(invoice.date); daily.set(key, (daily.get(key) ?? 0) + invoice.total); }
  const ventasDiarias = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(`${chartStartKey}T00:00:00-03:00`); date.setDate(date.getDate() + index);
    const key = argentinaDateKey(date); return { fecha: key, importe: daily.get(key) ?? 0 };
  });
  const byPayment = await db.select({ form: invoices.paymentForm, amount: sql<number>`sum(${invoices.total})` }).from(invoices).where(and(eq(invoices.status, "emitida"), gte(invoices.date, monthStart))).groupBy(invoices.paymentForm);
  const debtCount = await db.select({ customerId: accountMovements.customerId, balance: sql<number>`sum(case when ${accountMovements.type} = 'debito' then ${accountMovements.amount} else -${accountMovements.amount} end)` }).from(accountMovements).groupBy(accountMovements.customerId).having(sql`sum(case when ${accountMovements.type} = 'debito' then ${accountMovements.amount} else -${accountMovements.amount} end) > 0`);
  const activeCount = await db.select({ total: count() }).from(products).where(eq(products.active, true));
  const lowStockProducts = await db.select({ id: products.id, code: products.code, description: products.description, stock: products.stock, minStock: products.minStock }).from(products).where(and(eq(products.active, true), lte(products.stock, products.minStock))).orderBy(sql`${products.stock} asc`).limit(6);
  const totalSalesMonth = Number(monthRows[0]?.amount ?? 0);
  return {
    hoy: { cantidad: Number(todayRows[0]?.total ?? 0), importe: Number(todayRows[0]?.amount ?? 0) },
    mes: { cantidad: Number(monthRows[0]?.total ?? 0), importe: totalSalesMonth, ticketPromedio: monthRows[0]?.total ? Math.round(totalSalesMonth / Number(monthRows[0].total)) : 0 },
    cuentasCorrientes: { totalAdeudado: Number(debt.amount ?? 0), clientesConSaldo: debtCount.length },
    bajoMinimo: { cantidad: Number(low?.total ?? 0) },
    productosActivos: Number(activeCount[0]?.total ?? 0),
    productosParaReponer: lowStockProducts,
    ventasDiarias,
    porFormaDePago: byPayment.map((row) => ({ forma: row.form, importe: Number(row.amount ?? 0) })),
    masVendidos: bestSellers.map((row) => ({ productoId: row.productId, codigo: row.code, descripcion: row.description, unidades: Number(row.units ?? 0), importe: Number(row.amount ?? 0) })),
  };
}
