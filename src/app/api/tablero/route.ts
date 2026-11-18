import { errorResponse } from "@/lib/api-error";
import { getDashboard } from "@/lib/services/dashboard";

export async function GET() {
  try { return Response.json(await getDashboard()); }
  catch (error) { return errorResponse(error); }
}
