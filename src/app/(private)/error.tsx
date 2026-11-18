"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivateError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <section role="alert" className="mx-auto max-w-xl rounded-2xl border border-[var(--border)] bg-white p-8 text-center"><span className="mx-auto grid size-12 place-items-center rounded-full bg-amber-50 text-amber-700"><AlertTriangle/></span><h1 className="mt-4 text-xl font-semibold">No se pudo cargar esta pantalla</h1><p className="mt-2 text-sm text-[var(--muted)]">Intentá de nuevo. Si el problema continúa, revisá la conexión con la base de datos.</p><Button className="mt-5" onClick={() => reset()}><RotateCcw size={16}/>Reintentar</Button></section>;
}
