import { errorResponse } from "@/lib/api-error";
import { getPayment } from "@/lib/services/customers";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try { const { id } = await context.params; const payment = await getPayment(Number(id)); return Response.json({ ...payment, numeroRecibo: payment.formattedNumber, fecha: payment.date, cliente: { id: payment.customerId, nombre: payment.customer }, importe: payment.amount, medio: payment.method, usuario: { nombre: payment.user } }); }
  catch (error) { return errorResponse(error); }
}
