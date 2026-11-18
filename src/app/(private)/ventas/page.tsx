import { InvoiceList } from "@/components/invoice-list";
import { listInvoices } from "@/lib/services/invoices";
import { db } from "@/lib/db";
import { customers, users } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";

type Props = { searchParams: Promise<{ q?: string; desde?: string; hasta?: string; forma?: string; estado?: string; clienteId?: string; vendedorId?: string; page?: string }> };
export default async function InvoicesPage({ searchParams }: Props) {
  const filters = await searchParams;
  const [result, customerOptions, sellerOptions] = await Promise.all([
    listInvoices({ q: filters.q, from: filters.desde, to: filters.hasta, paymentForm: filters.forma, status: filters.estado, customerId: filters.clienteId, userId: filters.vendedorId }),
    db.select({ id: customers.id, name: customers.name }).from(customers).where(eq(customers.active, true)).orderBy(asc(customers.name)),
    db.select({ id: users.id, name: users.name }).from(users).where(eq(users.active, true)).orderBy(asc(users.name)),
  ]);
  const pageSize = 10; const page = Math.min(Math.max(1, Number(filters.page ?? 1) || 1), Math.max(1, Math.ceil(result.data.length / pageSize))); const invoices = result.data.slice((page - 1) * pageSize, page * pageSize);
  return <div className="space-y-6"><div><p className="text-sm font-medium text-[var(--primary)]">OPERACIONES</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Facturas</h1><p className="mt-2 text-sm text-[var(--muted)]">Consultá y filtrá las ventas registradas.</p></div><InvoiceList invoices={invoices} query={filters} totalIssued={result.totalIssued} customers={customerOptions} sellers={sellerOptions} page={page} pageSize={pageSize} total={result.data.length}/></div>;
}
