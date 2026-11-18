import { errorResponse } from "@/lib/api-error";
import { listStockMovements } from "@/lib/services/products";

export async function GET() {
  try { const rows = await listStockMovements(); return Response.json({ data: rows.map((row) => ({ ...row, fecha: row.createdAt, producto: { id: row.productId, codigo: row.code }, tipo: row.type, cantidad: row.quantity, existenciaResultante: row.resultingStock, motivo: row.reason, usuario: { nombre: row.user } })) }); }
  catch (error) { return errorResponse(error); }
}
