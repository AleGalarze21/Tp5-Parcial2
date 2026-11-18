"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, LayoutDashboard, ReceiptText, Users, UserRoundCog } from "lucide-react";

const links = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/ventas", label: "Ventas", icon: ReceiptText },
  { href: "/productos", label: "Productos", icon: Boxes },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/usuarios", label: "Usuarios", icon: UserRoundCog, admin: true },
];
export function SidebarNav({ role }: { role: string }) {
  const pathname = usePathname();
  return <nav className="space-y-1">{links.filter((link) => !link.admin || role === "admin").map(({ href, label, icon: Icon }) => {
    const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
    return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active ? "bg-[var(--primary-soft)] text-[var(--primary)]" : "text-slate-600 hover:bg-slate-50 hover:text-[var(--primary)]"}`}><Icon size={18}/>{label}</Link>;
  })}</nav>;
}
