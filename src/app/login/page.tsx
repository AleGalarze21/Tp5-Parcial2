import { redirect } from "next/navigation";
import { Cpu, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return <main className="grid min-h-screen bg-white md:grid-cols-[1fr_1fr]">
    <section className="relative hidden overflow-hidden bg-[#151713] p-12 text-white md:flex md:flex-col md:justify-between">
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(circle at 80% 35%, #76b900 0, transparent 34%), linear-gradient(135deg, transparent 58%, rgba(118,185,0,.17) 58.2%, transparent 58.6%)" }}/>
      <div className="relative flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-[#76b900] text-[#10130d]"><Cpu /></span><span className="text-lg font-bold tracking-wide">NEXUS GPU</span></div>
      <div className="relative max-w-lg"><p className="mb-4 text-sm font-semibold uppercase tracking-[.18em] text-[#a8e344]">Hardware para gaming e IA</p><h1 className="text-5xl font-semibold leading-tight">Potencia para lo que viene.</h1><p className="mt-5 max-w-md text-lg leading-relaxed text-white/65">Placas gráficas, componentes y equipos para inteligencia artificial. Todo tu negocio, en un solo panel.</p></div>
      <p className="relative text-sm text-white/45">CENTRO DE OPERACIONES <span className="mx-2">·</span> NEXUS GPU</p>
      <div className="absolute -right-20 -top-24 size-96 rounded-full border border-white/10"/><div className="absolute -bottom-40 -left-32 size-[500px] rounded-full border border-white/10"/>
    </section>
    <section className="flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3 md:hidden"><span className="grid size-10 place-items-center rounded-xl bg-[var(--primary)] text-[#10130d]"><Cpu size={20}/></span><strong>NEXUS GPU</strong></div>
        <div className="mb-8"><span className="mb-4 grid size-12 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]"><ShieldCheck /></span><h2 className="text-3xl font-semibold">Iniciá sesión</h2><p className="mt-2 text-sm text-[var(--muted)]">Ingresá tus datos para acceder al sistema.</p></div>
        <LoginForm />
      </div>
    </section>
  </main>;
}
