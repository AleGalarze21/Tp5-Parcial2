import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: `${process.env.NEXT_PUBLIC_APP_NAME ?? "Mostrador"} | Gestión comercial`,
  description: "Sistema de gestión comercial, ventas y existencias.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
