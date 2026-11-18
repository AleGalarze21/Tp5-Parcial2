import { errorResponse } from "@/lib/api-error";
import { listStockMovements } from "@/lib/services/products";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const rows = await listStockMovements(params.get("productoId") ? Number(params.get("productoId")) : undefined, { type: params.get("tipo") ?? undefined, from: params.get("desde") ?? undefined, to: params.get("hasta") ?? undefined });
    const page = Math.max(1, Number(params.get("page") ?? 1) || 1); const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize") ?? 20) || 20));
    return Response.json({ data: rows.slice((page - 1) * pageSize, page * pageSize).map((row) => ({ ...row, fecha: row.createdAt, producto: { id: row.productId, codigo: row.code }, tipo: row.type, cantidad: row.quantity, existenciaResultante: row.resultingStock, motivo: row.reason, referencia: row.invoiceId ? { facturaId: row.invoiceId, numero: `${String(row.pointOfSale).padStart(4, "0")}-${String(row.invoiceNumber).padStart(8, "0")}` } : null, usuario: { nombre: row.user } })), page, pageSize, total: rows.length });
  }
  catch (error) { return errorResponse(error); }
}
