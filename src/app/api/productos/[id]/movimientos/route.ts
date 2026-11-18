import { errorResponse, readJson } from "@/lib/api-error";
import { normalizeStockMovement } from "@/lib/api-mappers";
import { listStockMovements, moveStock } from "@/lib/services/products";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try { const { id } = await context.params; const rows = await listStockMovements(Number(id)); return Response.json({ data: rows.map((row) => ({ ...row, fecha: row.createdAt, producto: { id: row.productId, codigo: row.code }, tipo: row.type, cantidad: row.quantity, existenciaResultante: row.resultingStock, motivo: row.reason, referencia: row.invoiceId ? { facturaId: row.invoiceId, numero: `${String(row.pointOfSale).padStart(4, "0")}-${String(row.invoiceNumber).padStart(8, "0")}` } : null, usuario: { nombre: row.user } })) }); }
  catch (error) { return errorResponse(error); }
}
export async function POST(request: Request, context: Context) {
  try { const { id } = await context.params; return Response.json(await moveStock(Number(id), normalizeStockMovement(await readJson(request))), { status: 201 }); }
  catch (error) { return errorResponse(error); }
}
