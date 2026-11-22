"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function login(email: string, password: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message ?? "No se pudo iniciar sesión.");
      router.replace("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar sesión.");
      setBusy(false);
    }
  }

  async function submit(formData: FormData) {
    await login(String(formData.get("email") ?? ""), String(formData.get("password") ?? ""));
  }

  return <form action={submit} className="space-y-5">
    <label className="block space-y-2 text-sm font-medium">Email
      <span className="flex h-11 items-center gap-3 rounded-lg border border-[var(--border)] px-3 focus-within:border-[var(--primary)]"><Mail size={17} className="text-slate-400"/><input name="email" type="email" autoComplete="username" required className="w-full bg-transparent outline-none" placeholder="nombre@nexusgpu.test" /></span>
    </label>
    <label className="block space-y-2 text-sm font-medium">Contraseña
      <span className="flex h-11 items-center gap-3 rounded-lg border border-[var(--border)] px-3 focus-within:border-[var(--primary)]"><LockKeyhole size={17} className="text-slate-400"/><input name="password" type="password" autoComplete="current-password" required className="w-full bg-transparent outline-none" placeholder="Tu contraseña" /></span>
    </label>
    <p className="-mt-2 text-xs text-[var(--muted)]">Solicitá los datos de acceso al administrador.</p>
    {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    <Button disabled={busy} className="w-full">{busy ? "Ingresando…" : "Ingresar"}</Button>
    <div className="space-y-2 border-t border-[var(--border)] pt-4">
      <p className="text-center text-xs text-[var(--muted)]">O entrá directamente a una cuenta de demostración</p>
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" disabled={busy} onClick={() => login("laura@nexusgpu.test", "0987654321@Ale")}><ShieldCheck size={16}/>Administrador</Button>
        <Button type="button" variant="outline" disabled={busy} onClick={() => login("pablo@nexusgpu.test", "0987654321@Ale1")}><UserRound size={16}/>Vendedor</Button>
      </div>
    </div>
  </form>;
}
