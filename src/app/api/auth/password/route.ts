import { errorResponse, readJson } from "@/lib/api-error";
import { changePassword } from "@/lib/services/users";

export async function PUT(request: Request) {
  try { await changePassword(await readJson(request)); return new Response(null, { status: 204 }); }
  catch (error) { return errorResponse(error); }
}
