import Link from "next/link";
import { ArrowUpRight, CircleDollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerManager } from "@/components/customer-manager";
import { getCurrentUser } from "@/lib/auth";
import { listCustomers } from "@/lib/services/customers";
import { currency } from "@/lib/utils";

type Props = { searchParams: Promise<{ q?: string }> };
export default async function CustomersPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const [user, result] = await Promise.all([getCurrentUser(), listCustomers({ q })]);
  return <div className="space-y-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-[var(--primary)]">RELACIONES COMERCIALES</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Clientes</h1><p className="mt-2 text-sm text-[var(--muted)]">Consultá sus datos y el saldo de cuenta corriente.</p></div><Link href="/clientes/saldos"><Button variant="outline"><CircleDollarSign size={16}/>Saldos con deuda<ArrowUpRight size={16}/></Button></Link></div><div className="flex flex-wrap gap-3"><div className="rounded-xl border border-[var(--border)] bg-white px-4 py-3"><span className="text-xs text-[var(--muted)]">Clientes registrados</span><strong className="mt-1 block text-xl">{result.data.length}</strong></div><div className="rounded-xl border border-[var(--border)] bg-white px-4 py-3"><span className="text-xs text-[var(--muted)]">Total adeudado</span><strong className="mt-1 block text-xl">{currency(result.totalDebt)}</strong></div></div><CustomerManager customers={result.data} query={q} canEdit={user?.role === "admin"}/></div>;
}
