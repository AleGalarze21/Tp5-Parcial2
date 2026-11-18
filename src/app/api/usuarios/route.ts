import { errorResponse, readJson } from "@/lib/api-error";
import { createUser, listUsers } from "@/lib/services/users";
import { normalizeUser } from "@/lib/api-mappers";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const rows = await listUsers({ q: params.get("q") ?? undefined, active: params.get("activo") ?? undefined });
    const page = Math.max(1, Number(params.get("page") ?? 1) || 1); const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize") ?? 20) || 20));
    return Response.json({ data: rows.slice((page - 1) * pageSize, page * pageSize).map((row) => ({ ...row, nombre: row.name, rol: row.role, activo: row.active })), page, pageSize, total: rows.length });
  } catch (error) { return errorResponse(error); }
}
export async function POST(request: Request) {
  try { const row = await createUser(normalizeUser(await readJson(request))); return Response.json({ ...row, nombre: row.name, rol: row.role, activo: row.active }, { status: 201 }); }
  catch (error) { return errorResponse(error); }
}
