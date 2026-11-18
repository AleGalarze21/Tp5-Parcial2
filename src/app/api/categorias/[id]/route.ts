import { errorResponse, readJson } from "@/lib/api-error";
import { updateCategory } from "@/lib/services/categories";

type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  try { const { id } = await context.params; return Response.json(await updateCategory(Number(id), await readJson(request))); }
  catch (error) { return errorResponse(error); }
}
