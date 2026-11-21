import { notFound } from "next/navigation";
import { InvoiceDetails } from "@/components/invoice-details";
import { getCurrentUser } from "@/lib/auth";
import { getInvoice } from "@/lib/services/invoices";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const invoiceId = Number(id);
  if (!Number.isInteger(invoiceId) || invoiceId < 1) notFound();
  const [invoice, user] = await Promise.all([getInvoice(invoiceId), getCurrentUser()]);
  return <InvoiceDetails invoice={invoice} isAdmin={user?.role === "admin"} businessName={process.env.NEXT_PUBLIC_BUSINESS_NAME ?? "NEXUS GPU"} businessAddress={process.env.NEXT_PUBLIC_BUSINESS_ADDRESS} businessPhone={process.env.NEXT_PUBLIC_BUSINESS_PHONE}/>;
}
