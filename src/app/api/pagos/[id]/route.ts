import { errorResponse } from "@/lib/api-error";
import { getPayment } from "@/lib/services/customers";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try { const { id } = await context.params; return Response.json(await getPayment(Number(id))); }
  catch (error) { return errorResponse(error); }
}
