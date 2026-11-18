import { errorResponse, readJson } from "@/lib/api-error";
import { createCategory, listCategories } from "@/lib/services/categories";
import { normalizeCategory } from "@/lib/api-mappers";

export async function GET() {
  try { const rows = await listCategories(); return Response.json({ data: rows.map((row) => ({ ...row, nombre: row.name, activa: row.active })) }); }
  catch (error) { return errorResponse(error); }
}
export async function POST(request: Request) {
  try { const row = await createCategory(normalizeCategory(await readJson(request))); return Response.json({ ...row, nombre: row.name, activa: row.active }, { status: 201 }); }
  catch (error) { return errorResponse(error); }
}
