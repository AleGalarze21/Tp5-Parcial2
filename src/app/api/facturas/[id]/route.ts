import { errorResponse } from "@/lib/api-error";
import { getInvoice } from "@/lib/services/invoices";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    const { id } = await context.params; const invoice = await getInvoice(Number(id));
    return Response.json({ ...invoice, numeroFormateado: invoice.formattedNumber, fecha: invoice.date, estado: invoice.status, cliente: invoice.customer ? { id: invoice.customer.id, nombre: invoice.customer.name, tipoDoc: invoice.customer.documentType, nroDoc: invoice.customer.documentNumber, domicilio: invoice.customer.address } : null, vendedor: { id: invoice.seller.id, nombre: invoice.seller.name }, items: invoice.items.map((item) => ({ ...item, productoId: item.productId, codigo: item.code, descripcion: item.description, cantidad: item.quantity, precioUnitario: item.unitPrice })), pago: invoice.payment });
  }
  catch (error) { return errorResponse(error); }
}
