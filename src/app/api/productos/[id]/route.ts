import { errorResponse, readJson } from "@/lib/api-error";
import { getProduct, updateProduct } from "@/lib/services/products";
import { normalizeProduct, publicProduct } from "@/lib/api-mappers";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try { const { id } = await context.params; return Response.json(publicProduct(await getProduct(Number(id)))); }
  catch (error) { return errorResponse(error); }
}
export async function PATCH(request: Request, context: Context) {
  try { const { id } = await context.params; const productId = Number(id); await updateProduct(productId, normalizeProduct(await readJson(request))); return Response.json(publicProduct(await getProduct(productId))); }
  catch (error) { return errorResponse(error); }
}
