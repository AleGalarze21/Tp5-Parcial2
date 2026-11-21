"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(formData: FormData) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: formData.get("email"), password: formData.get("password") }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message ?? "No se pudo iniciar sesión.");
      router.replace("/"); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo iniciar sesión."); setBusy(false); }
  }
  return <form action={submit} className="space-y-5">
    <label className="block space-y-2 text-sm font-medium">Email
      <span className="flex h-11 items-center gap-3 rounded-lg border border-[var(--border)] px-3 focus-within:border-[var(--primary)]"><Mail size={17} className="text-slate-400"/><input name="email" type="email" autoComplete="username" required className="w-full bg-transparent outline-none" placeholder="nombre@nexusgpu.test" /></span>
    </label>
    <label className="block space-y-2 text-sm font-medium">Contraseña
      <span className="flex h-11 items-center gap-3 rounded-lg border border-[var(--border)] px-3 focus-within:border-[var(--primary)]"><LockKeyhole size={17} className="text-slate-400"/><input name="password" type="password" autoComplete="current-password" required className="w-full bg-transparent outline-none" placeholder="Tu contraseña" /></span>
    </label>
    {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    <Button disabled={busy} className="w-full">{busy ? "Ingresando…" : "Ingresar"}</Button>
  </form>;
}
