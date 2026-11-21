"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownToLine, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { currency } from "@/lib/utils";
import { accountPaymentSchema } from "@/lib/schemas";
import { FieldError, issuesToFieldErrors, serverFieldErrors, type FieldErrors } from "@/components/ui/field-error";

export function PaymentForm({ customerId, balance }: { customerId: number; balance: number }) {
  const router = useRouter(); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  async function submit(form: FormData) {
    setBusy(true); setError(""); setFieldErrors({});
    const validation = accountPaymentSchema.safeParse({ amount: Math.round(Number(form.get("amount")) * 100), method: form.get("method"), note: form.get("note") });
    if (!validation.success) { setBusy(false); setFieldErrors(issuesToFieldErrors(validation.error.issues)); return; }
    const response = await fetch(`/api/clientes/${customerId}/pagos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(validation.data) });
    const payload = await response.json(); setBusy(false);
    if (!response.ok) { const details = serverFieldErrors(payload); if (Object.keys(details).length) setFieldErrors(details); else setError(payload.error?.message ?? "No se pudo registrar el pago."); return; }
    router.push(`/clientes/pagos/${payload.id}`); router.refresh();
  }
  return <section className="rounded-2xl border border-[var(--border)] bg-white p-5"><div className="mb-4 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]"><Receipt size={19}/></span><div><h2 className="font-semibold">Registrar pago</h2><p className="text-xs text-[var(--muted)]">Deuda actual: {currency(balance)}</p></div></div><form action={submit} className="space-y-4"><label className="block text-sm font-medium">Importe<input name="amount" type="number" min="0.01" max={(balance / 100).toFixed(2)} step="0.01" required aria-invalid={Boolean(fieldErrors.amount)} aria-describedby={fieldErrors.amount ? "amount-error" : undefined} className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] px-3" placeholder="0,00" disabled={balance <= 0}/><FieldError name="amount" errors={fieldErrors}/></label><label className="block text-sm font-medium">Medio de pago<select name="method" aria-invalid={Boolean(fieldErrors.method)} aria-describedby={fieldErrors.method ? "method-error" : undefined} className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] px-3"><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option><option value="tarjeta_debito">Tarjeta de débito</option></select><FieldError name="method" errors={fieldErrors}/></label><label className="block text-sm font-medium">Observación<input name="note" maxLength={240} aria-invalid={Boolean(fieldErrors.note)} aria-describedby={fieldErrors.note ? "note-error" : undefined} className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] px-3" placeholder="Opcional"/><FieldError name="note" errors={fieldErrors}/></label>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<Button disabled={busy || balance <= 0} className="w-full"><ArrowDownToLine size={16}/>{busy ? "Guardando…" : "Registrar pago"}</Button></form></section>;
}
