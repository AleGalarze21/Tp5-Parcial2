import { errorResponse, readJson } from "@/lib/api-error";
import { getCustomer, updateCustomer } from "@/lib/services/customers";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try { const { id } = await context.params; return Response.json(await getCustomer(Number(id))); }
  catch (error) { return errorResponse(error); }
}
export async function PATCH(request: Request, context: Context) {
  try { const { id } = await context.params; return Response.json(await updateCustomer(Number(id), await readJson(request))); }
  catch (error) { return errorResponse(error); }
}
