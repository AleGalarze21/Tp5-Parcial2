import { errorResponse, readJson } from "@/lib/api-error";
import { registerPayment } from "@/lib/services/customers";

type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, context: Context) {
  try { const { id } = await context.params; return Response.json(await registerPayment(Number(id), await readJson(request)), { status: 201 }); }
  catch (error) { return errorResponse(error); }
}
