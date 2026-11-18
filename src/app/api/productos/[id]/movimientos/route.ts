import { errorResponse, readJson } from "@/lib/api-error";
import { listStockMovements, moveStock } from "@/lib/services/products";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try { const { id } = await context.params; return Response.json({ data: await listStockMovements(Number(id)) }); }
  catch (error) { return errorResponse(error); }
}
export async function POST(request: Request, context: Context) {
  try { const { id } = await context.params; return Response.json(await moveStock(Number(id), await readJson(request)), { status: 201 }); }
  catch (error) { return errorResponse(error); }
}
