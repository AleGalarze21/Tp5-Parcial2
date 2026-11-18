import { errorResponse } from "@/lib/api-error";
import { listAccountMovements } from "@/lib/services/customers";

type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  try { const { id } = await context.params; const params = new URL(request.url).searchParams; return Response.json(await listAccountMovements(Number(id), params.get("desde") ?? undefined, params.get("hasta") ?? undefined)); }
  catch (error) { return errorResponse(error); }
}
