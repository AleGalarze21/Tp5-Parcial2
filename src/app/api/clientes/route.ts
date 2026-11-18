import { errorResponse, readJson } from "@/lib/api-error";
import { createCustomer, listCustomers } from "@/lib/services/customers";
import { normalizeCustomer, publicCustomer } from "@/lib/api-mappers";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const result = await listCustomers({ q: params.get("q") ?? undefined, withDebt: params.get("conDeuda") === "true", order: params.get("orden") === "saldo" ? "balance" : "name" });
    const page = Math.max(1, Number(params.get("page") ?? 1) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize") ?? 20) || 20));
    return Response.json({ data: result.data.slice((page - 1) * pageSize, page * pageSize).map(publicCustomer), page, pageSize, total: result.data.length, ...(params.get("conDeuda") === "true" ? { totalAdeudado: result.totalDebt } : {}) });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try { return Response.json(publicCustomer(await createCustomer(normalizeCustomer(await readJson(request)))), { status: 201 }); }
  catch (error) { return errorResponse(error); }
}
