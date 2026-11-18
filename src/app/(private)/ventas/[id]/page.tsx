import { notFound } from "next/navigation";
import { InvoiceDetails } from "@/components/invoice-details";
import { getCurrentUser } from "@/lib/auth";
import { getInvoice } from "@/lib/services/invoices";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const invoiceId = Number(id);
  if (!Number.isInteger(invoiceId) || invoiceId < 1) notFound();
  const [invoice, user] = await Promise.all([getInvoice(invoiceId), getCurrentUser()]);
  return <InvoiceDetails invoice={invoice} isAdmin={user?.role === "admin"}/>;
}
