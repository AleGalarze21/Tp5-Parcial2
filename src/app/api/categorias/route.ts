import { errorResponse, readJson } from "@/lib/api-error";
import { createCategory, listCategories } from "@/lib/services/categories";

export async function GET() {
  try { return Response.json({ data: await listCategories() }); }
  catch (error) { return errorResponse(error); }
}
export async function POST(request: Request) {
  try { return Response.json(await createCategory(await readJson(request)), { status: 201 }); }
  catch (error) { return errorResponse(error); }
}
