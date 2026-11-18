import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewSale } from "@/components/new-sale";
import { listCustomers } from "@/lib/services/customers";
import { listProducts } from "@/lib/services/products";

export default async function NewSalePage() {
  const [products, customers] = await Promise.all([listProducts(), listCustomers()]);
  return <div className="space-y-6"><div><Link href="/ventas"><Button variant="ghost" size="sm" className="mb-3 -ml-3"><ArrowLeft size={16}/>Volver a facturas</Button></Link><p className="text-sm font-medium text-[var(--primary)]">VENTAS</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Nueva venta</h1><p className="mt-2 text-sm text-[var(--muted)]">Agregá productos, elegí cómo se paga y confirmá la operación.</p></div><NewSale products={products.map(({ id, code, description, price, stock }) => ({ id, code, description, price, stock }))} customers={customers.data.map(({ id, name, documentType, documentNumber, currentAccount, creditLimit, balance }) => ({ id, name, documentType, documentNumber, currentAccount, creditLimit, balance }))}/></div>;
}
