import { errorResponse, readJson } from "@/lib/api-error";
import { getCustomer, updateCustomer } from "@/lib/services/customers";
import { normalizeCustomer, publicCustomer } from "@/lib/api-mappers";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try { const { id } = await context.params; return Response.json(publicCustomer(await getCustomer(Number(id)))); }
  catch (error) { return errorResponse(error); }
}
export async function PATCH(request: Request, context: Context) {
  try { const { id } = await context.params; return Response.json(publicCustomer(await updateCustomer(Number(id), normalizeCustomer(await readJson(request))))); }
  catch (error) { return errorResponse(error); }
}
