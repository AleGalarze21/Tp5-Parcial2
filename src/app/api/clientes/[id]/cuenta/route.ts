import { errorResponse } from "@/lib/api-error";
import { listAccountMovements } from "@/lib/services/customers";

type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  try {
    const { id } = await context.params; const params = new URL(request.url).searchParams;
    const result = await listAccountMovements(Number(id), params.get("desde") ?? undefined, params.get("hasta") ?? undefined);
    return Response.json({ cliente: { id: result.customer.id, nombre: result.customer.name }, saldoAnterior: result.previousBalance, movimientos: result.movements.map((row) => ({ ...row, fecha: row.date, tipo: row.type, importe: row.amount, facturaId: row.invoiceId, pagoId: row.paymentId, saldo: row.balance })), saldo: result.balance });
  }
  catch (error) { return errorResponse(error); }
}
