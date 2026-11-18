import { redirect } from "next/navigation";
import { Activity, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return <main className="grid min-h-screen bg-white md:grid-cols-[1fr_1fr]">
    <section className="relative hidden overflow-hidden bg-[var(--primary)] p-12 text-white md:flex md:flex-col md:justify-between">
      <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-white/15"><Activity /></span><span className="text-lg font-semibold">Mostrador</span></div>
      <div className="max-w-lg"><p className="mb-4 text-sm font-semibold uppercase tracking-[.18em] text-white/70">Gestión comercial simple</p><h1 className="text-5xl font-semibold leading-tight">Tu negocio, en orden.</h1><p className="mt-5 max-w-md text-lg leading-relaxed text-white/75">Ventas, productos y cuentas corrientes en un mismo lugar.</p></div>
      <p className="text-sm text-white/60">Plataforma de gestión para comercios</p>
      <div className="absolute -right-20 -top-24 size-96 rounded-full border border-white/10"/><div className="absolute -bottom-40 -left-32 size-[500px] rounded-full border border-white/10"/>
    </section>
    <section className="flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3 md:hidden"><span className="grid size-10 place-items-center rounded-xl bg-[var(--primary)] text-white"><Activity size={20}/></span><strong>Mostrador</strong></div>
        <div className="mb-8"><span className="mb-4 grid size-12 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]"><ShieldCheck /></span><h2 className="text-3xl font-semibold">Iniciá sesión</h2><p className="mt-2 text-sm text-[var(--muted)]">Ingresá tus datos para acceder al sistema.</p></div>
        <LoginForm />
      </div>
    </section>
  </main>;
}
