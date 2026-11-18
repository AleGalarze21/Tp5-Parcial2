import { errorResponse } from "@/lib/api-error";
import { resetUserPassword } from "@/lib/services/users";

type Context = { params: Promise<{ id: string }> };
export async function POST(_request: Request, context: Context) {
  try { const { id } = await context.params; return Response.json(await resetUserPassword(Number(id))); }
  catch (error) { return errorResponse(error); }
}
