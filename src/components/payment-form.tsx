"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownToLine, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { currency } from "@/lib/utils";

export function PaymentForm({ customerId, balance }: { customerId: number; balance: number }) {
  const router = useRouter(); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(form: FormData) {
    setBusy(true); setError("");
    const amount = Math.round(Number(form.get("amount")) * 100);
    const response = await fetch(`/api/clientes/${customerId}/pagos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount, method: form.get("method"), note: form.get("note") }) });
    const payload = await response.json(); setBusy(false);
    if (!response.ok) { setError(payload.error?.message ?? "No se pudo registrar el pago."); return; }
    router.push(`/clientes/pagos/${payload.id}`); router.refresh();
  }
  return <section className="rounded-2xl border border-[var(--border)] bg-white p-5"><div className="mb-4 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]"><Receipt size={19}/></span><div><h2 className="font-semibold">Registrar pago</h2><p className="text-xs text-[var(--muted)]">Deuda actual: {currency(balance)}</p></div></div><form action={submit} className="space-y-4"><label className="block text-sm font-medium">Importe<input name="amount" type="number" min="0.01" max={(balance / 100).toFixed(2)} step="0.01" required className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] px-3" placeholder="0,00" disabled={balance <= 0}/></label><label className="block text-sm font-medium">Medio de pago<select name="method" className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] px-3"><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option><option value="tarjeta_debito">Tarjeta de débito</option></select></label><label className="block text-sm font-medium">Observación<input name="note" maxLength={240} className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] px-3" placeholder="Opcional"/></label>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<Button disabled={busy || balance <= 0} className="w-full"><ArrowDownToLine size={16}/>{busy ? "Guardando…" : "Registrar pago"}</Button></form></section>;
}
