import { errorResponse, readJson } from "@/lib/api-error";
import { registerPayment } from "@/lib/services/customers";
import { normalizePayment } from "@/lib/api-mappers";

type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params; const payment = await registerPayment(Number(id), normalizePayment(await readJson(request)));
    return Response.json({ ...payment, numeroRecibo: payment.receiptNumber, fecha: payment.date, cliente: { id: payment.customer.id, nombre: payment.customer.name }, importe: payment.amount, medio: payment.method, usuario: { id: payment.user.id, nombre: payment.user.name }, saldoCliente: payment.balance }, { status: 201 });
  }
  catch (error) { return errorResponse(error); }
}
