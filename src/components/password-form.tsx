"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { passwordChangeSchema } from "@/lib/schemas";
import { FieldError, issuesToFieldErrors, type FieldErrors } from "@/components/ui/field-error";

export function PasswordForm() {
  const [error, setError] = useState(""); const [success, setSuccess] = useState(""); const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  async function submit(form: FormData) {
    setBusy(true); setError(""); setSuccess(""); setFieldErrors({});
    const validation = passwordChangeSchema.safeParse({ actual: form.get("actual"), nueva: form.get("nueva") });
    if (!validation.success) { setBusy(false); setFieldErrors(issuesToFieldErrors(validation.error.issues)); return; }
    const response = await fetch("/api/auth/password", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(validation.data) });
    const payload = response.status === 204 ? null : await response.json(); setBusy(false);
    if (!response.ok) { setError(payload?.error?.message ?? "No se pudo cambiar la contraseña."); return; }
    setSuccess("Contraseña actualizada.");
  }
  return <section className="max-w-xl rounded-2xl border border-[var(--border)] bg-white p-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]"><KeyRound size={18}/></span><div><h2 className="font-semibold">Cambiar contraseña</h2><p className="text-sm text-[var(--muted)]">Elegí una contraseña de al menos 8 caracteres.</p></div></div><form action={submit} className="mt-5 space-y-4"><label className="block text-sm font-medium">Contraseña actual<input name="actual" type="password" required autoComplete="current-password" aria-invalid={Boolean(fieldErrors.actual)} aria-describedby={fieldErrors.actual ? "actual-error" : undefined} className="mt-1 h-11 w-full rounded-lg border border-[var(--border)] px-3"/><FieldError name="actual" errors={fieldErrors}/></label><label className="block text-sm font-medium">Nueva contraseña<input name="nueva" type="password" minLength={8} required autoComplete="new-password" aria-invalid={Boolean(fieldErrors.nueva)} aria-describedby={fieldErrors.nueva ? "nueva-error" : undefined} className="mt-1 h-11 w-full rounded-lg border border-[var(--border)] px-3"/><FieldError name="nueva" errors={fieldErrors}/></label>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}{success && <p role="status" className="text-sm text-emerald-700">{success}</p>}<Button disabled={busy}>{busy ? "Actualizando…" : "Actualizar contraseña"}</Button></form></section>;
}
