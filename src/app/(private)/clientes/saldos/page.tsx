import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listCustomers } from "@/lib/services/customers";
import { currency } from "@/lib/utils";

export default async function CustomerBalancesPage() {
  const result = await listCustomers({ withDebt: true, order: "balance" });
  return <div className="space-y-6"><div><Link href="/clientes"><Button variant="ghost" size="sm" className="mb-3 -ml-3"><ArrowLeft size={16}/>Volver a clientes</Button></Link><p className="text-sm font-medium text-[var(--primary)]">CUENTAS CORRIENTES</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Saldos pendientes</h1><p className="mt-2 text-sm text-[var(--muted)]">Clientes con deuda, ordenados por saldo.</p></div><div className="rounded-2xl border border-[var(--border)] bg-white p-5"><p className="text-sm text-[var(--muted)]">Total adeudado</p><p className="mt-1 text-3xl font-semibold">{currency(result.totalDebt)}</p></div><section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white"><div className="divide-y divide-[var(--border)]">{result.data.map((customer) => <Link key={customer.id} href={`/clientes/${customer.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50"><div><p className="font-semibold">{customer.name}</p><p className="mt-1 text-xs text-[var(--muted)]">{customer.documentType} · {customer.documentNumber}</p></div><div className="flex items-center gap-3"><strong className="text-amber-800">{currency(customer.balance)}</strong><ArrowUpRight size={17} className="text-slate-400"/></div></Link>)}{result.data.length === 0 && <p className="p-10 text-center text-sm text-[var(--muted)]">No hay clientes con deuda pendiente.</p>}</div></section></div>;
}
