import { errorResponse, readJson } from "@/lib/api-error";
import { createInvoice, listInvoices } from "@/lib/services/invoices";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const result = await listInvoices({ q: params.get("q") ?? undefined, from: params.get("desde") ?? undefined, to: params.get("hasta") ?? undefined, customerId: params.get("clienteId") ?? undefined, userId: params.get("vendedorId") ?? undefined, paymentForm: params.get("forma") ?? undefined, status: params.get("estado") ?? undefined });
    const page = Math.max(1, Number(params.get("page") ?? 1) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize") ?? 20) || 20));
    return Response.json({ data: result.data.slice((page - 1) * pageSize, page * pageSize).map((row) => ({ ...row, puntoVenta: row.pointOfSale, numero: row.number, numeroFormateado: `${String(row.pointOfSale).padStart(4, "0")}-${String(row.number).padStart(8, "0")}`, fecha: row.date, forma: row.paymentForm, estado: row.status, cliente: row.customerName ?? "Consumidor final", vendedor: row.sellerName })), page, pageSize, total: result.data.length, totalEmitido: result.totalIssued });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try { return Response.json(await createInvoice(await readJson(request)), { status: 201 }); }
  catch (error) { return errorResponse(error); }
}
