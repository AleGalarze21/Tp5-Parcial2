import { errorResponse, readJson } from "@/lib/api-error";
import { updateUser } from "@/lib/services/users";
import { normalizeUser } from "@/lib/api-mappers";

type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  try { const { id } = await context.params; const row = await updateUser(Number(id), normalizeUser(await readJson(request))); return Response.json({ ...row, nombre: row.name, rol: row.role, activo: row.active }); }
  catch (error) { return errorResponse(error); }
}
