import { errorResponse, readJson } from "@/lib/api-error";
import { updateCategory } from "@/lib/services/categories";
import { normalizeCategory } from "@/lib/api-mappers";

type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  try { const { id } = await context.params; const row = await updateCategory(Number(id), normalizeCategory(await readJson(request))); return Response.json({ ...row, nombre: row.name, activa: row.active }); }
  catch (error) { return errorResponse(error); }
}
