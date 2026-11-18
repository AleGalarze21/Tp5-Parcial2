import { clearSession, requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/api-error";

export async function POST() {
  try { await requireUser(); await clearSession(); return new Response(null, { status: 204 }); }
  catch (error) { return errorResponse(error); }
}
