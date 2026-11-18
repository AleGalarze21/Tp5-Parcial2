import { InvoiceList } from "@/components/invoice-list";
import { listInvoices } from "@/lib/services/invoices";

type Props = { searchParams: Promise<{ q?: string; desde?: string; hasta?: string; forma?: string; estado?: string }> };
export default async function InvoicesPage({ searchParams }: Props) {
  const filters = await searchParams;
  const result = await listInvoices({ q: filters.q, from: filters.desde, to: filters.hasta, paymentForm: filters.forma, status: filters.estado });
  return <div className="space-y-6"><div><p className="text-sm font-medium text-[var(--primary)]">OPERACIONES</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Facturas</h1><p className="mt-2 text-sm text-[var(--muted)]">Consultá y filtrá las ventas registradas.</p></div><InvoiceList invoices={result.data} query={filters} totalIssued={result.totalIssued}/></div>;
}
