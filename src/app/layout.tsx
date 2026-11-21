import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: `${process.env.NEXT_PUBLIC_APP_NAME ?? "NEXUS GPU"} | Hardware & IA`,
  description: "Gestión de ventas, inventario y clientes para hardware, gaming e inteligencia artificial.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
