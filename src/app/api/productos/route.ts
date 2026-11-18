import { errorResponse, readJson } from "@/lib/api-error";
import { createProduct, getProduct, listProducts } from "@/lib/services/products";
import { normalizeProduct, publicProduct } from "@/lib/api-mappers";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const data = await listProducts({ q: params.get("q") ?? undefined, categoryId: params.get("categoriaId") ?? undefined, belowMinimum: params.get("bajoMinimo") === "true", active: (params.get("activo") as "true" | "false" | "all") ?? "true" });
    const page = Math.max(1, Number(params.get("page") ?? 1) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize") ?? 20) || 20));
    return Response.json({ data: data.slice((page - 1) * pageSize, page * pageSize).map(publicProduct), page, pageSize, total: data.length });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try { const created = await createProduct(normalizeProduct(await readJson(request))); return Response.json(publicProduct(await getProduct(created.id)), { status: 201 }); }
  catch (error) { return errorResponse(error); }
}
