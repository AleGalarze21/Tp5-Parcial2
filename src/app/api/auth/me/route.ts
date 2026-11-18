import { errorResponse } from "@/lib/api-error";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try { const user = await requireUser(); return Response.json({ id: user.id, nombre: user.name, email: user.email, rol: user.role }); }
  catch (error) { return errorResponse(error); }
}
