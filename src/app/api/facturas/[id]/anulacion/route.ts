import { errorResponse, readJson } from "@/lib/api-error";
import { cancelInvoice } from "@/lib/services/invoices";

type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, context: Context) {
  try { const { id } = await context.params; return Response.json(await cancelInvoice(Number(id), await readJson(request))); }
  catch (error) { return errorResponse(error); }
}
