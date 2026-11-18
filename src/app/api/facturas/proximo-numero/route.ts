import { errorResponse } from "@/lib/api-error";
import { getNextInvoiceNumber } from "@/lib/services/invoices";

export async function GET() {
  try { return Response.json({ numeroFormateado: await getNextInvoiceNumber() }); }
  catch (error) { return errorResponse(error); }
}
