import { errorResponse } from "@/lib/api-error";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try { return Response.json(await requireUser()); }
  catch (error) { return errorResponse(error); }
}
