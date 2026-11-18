import { errorResponse } from "@/lib/api-error";
import { listStockMovements } from "@/lib/services/products";

export async function GET() {
  try { return Response.json({ data: await listStockMovements() }); }
  catch (error) { return errorResponse(error); }
}
