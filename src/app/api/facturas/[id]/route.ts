import { errorResponse } from "@/lib/api-error";
import { getInvoice } from "@/lib/services/invoices";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try { const { id } = await context.params; return Response.json(await getInvoice(Number(id))); }
  catch (error) { return errorResponse(error); }
}
