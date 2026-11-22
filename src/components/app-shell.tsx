import Link from "next/link";
import { redirect } from "next/navigation";
import { Cpu, CircleUserRound, LogOut, Menu } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/components/logout-button";
import { SidebarNav } from "@/components/sidebar-nav";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <div className="min-h-screen bg-[var(--background)] md:flex">
    <aside className="hidden w-64 shrink-0 border-r border-[#242821] bg-[#151713] p-5 text-white md:flex md:flex-col">
      <Link href="/" className="mb-8 flex items-center gap-3 px-2">
        <span className="grid size-10 place-items-center rounded-xl bg-[var(--primary)] text-[#10130d]"><Cpu size={21} /></span>
        <span><strong className="block text-base tracking-wide">NEXUS GPU</strong><small className="text-xs text-white/50">HARDWARE & IA</small></span>
      </Link>
      <SidebarNav role={user.role}/>
      <div className="mt-auto border-t border-white/10 pt-4">
        <Link href="/perfil" className="mb-3 flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-white/80 hover:bg-white/5"><CircleUserRound size={18} /><span className="truncate">{user.name}</span></Link>
        <form action={logoutAction}><Button variant="ghost" className="w-full justify-start text-white/60 hover:bg-white/5 hover:text-white"><LogOut size={17} />Cerrar sesión</Button></form>
      </div>
    </aside>
    <main className="min-w-0 flex-1">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--border)] bg-white px-5 md:px-8">
        <div className="flex items-center gap-2 md:hidden"><Cpu size={20} className="text-[var(--primary)]"/><strong>NEXUS GPU</strong></div>
        <div className="hidden text-sm text-[var(--muted)] md:block">Centro de operaciones <span className="mx-2 text-[var(--border)]">/</span> Hardware e inteligencia artificial</div>
        <div className="flex items-center gap-3"><span className="hidden text-sm text-slate-600 sm:block">{user.name}</span><span className="hidden rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-semibold capitalize text-[var(--primary)] sm:inline-flex">{user.role}</span>
          <form action={logoutAction}><Button size="sm" variant="outline" className="px-2 sm:px-3"><LogOut size={16}/><span className="hidden sm:inline">Cerrar sesión</span><span className="sm:hidden">Salir</span></Button></form>
          <details className="relative md:hidden"><summary className="grid size-10 list-none place-items-center rounded-lg border border-[var(--border)]"><Menu size={18}/></summary><nav className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-[var(--border)] bg-white p-2 shadow-xl">{[{ href: "/", label: "Inicio" }, { href: "/ventas", label: "Ventas" }, { href: "/productos", label: "Productos" }, { href: "/clientes", label: "Clientes" }, ...(user.role === "admin" ? [{ href: "/usuarios", label: "Usuarios" }] : [])].map((link) => <Link key={link.href} href={link.href} className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50">{link.label}</Link>)}<Link href="/perfil" className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50">Mi perfil</Link><form action={logoutAction}><button className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50">Cerrar sesión</button></form></nav></details>
        </div>
      </header>
      <div className="mx-auto w-full max-w-[1440px] p-5 md:p-8">{children}</div>
    </main>
  </div>;
}
