import { and, desc, eq, gte, inArray, like, lte, or, sql } from "drizzle-orm";
import { ApiError } from "@/lib/api-error";
import { requireAdmin, requireUser, type AuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { accountMovements, customers, invoiceItems, invoices, products, sequences, users } from "@/lib/db/schema";
import { nextSequence } from "@/lib/services/sequences";
import { moveStockInTransaction } from "@/lib/services/stock";
import { invoiceCancellationSchema, invoiceSchema } from "@/lib/schemas";
import { formatInvoiceNumber } from "@/lib/utils";

export async function getNextInvoiceNumber() {
  await requireUser();
  const [row] = await db.select({ value: sequences.value }).from(sequences).where(eq(sequences.kind, "factura")).limit(1);
  return formatInvoiceNumber(1, (row?.value ?? 0) + 1);
}

export async function createInvoice(input: unknown, asUser?: AuthenticatedUser, date = new Date()) {
  const user = await requireUser(asUser);
  const parsed = invoiceSchema.safeParse(input);
  if (!parsed.success) throw new ApiError(422, "VALIDACION", "Revisá el comprador, los productos y la forma de pago.", parsed.error.issues.map((issue) => ({ campo: String(issue.path[0] ?? "factura"), mensaje: issue.message })));
  const data = parsed.data;
  return db.transaction(async (tx) => {
    const ids = data.items.map((item) => item.productoId);
    const foundProducts = await tx.select().from(products).where(inArray(products.id, ids));
    if (foundProducts.length !== ids.length) throw new ApiError(404, "NO_ENCONTRADO", "Uno o más productos no existen.");
    const inactive = foundProducts.filter((product) => !product.active);
    if (inactive.length) throw new ApiError(422, "PRODUCTO_INACTIVO", "Hay productos inactivos en la venta.", inactive.map((product) => ({ productoId: product.id, codigo: product.code })));
    let customer: typeof customers.$inferSelect | null = null;
    if (data.clienteId !== null) {
      const [row] = await tx.select().from(customers).where(eq(customers.id, data.clienteId)).limit(1);
      if (!row || !row.active) throw new ApiError(404, "NO_ENCONTRADO", "El cliente no existe o está inactivo.");
      customer = row;
    }
    if (data.pago.forma === "cuenta_corriente" && (!customer || !customer.currentAccount)) throw new ApiError(422, "CUENTA_CORRIENTE_NO_HABILITADA", "Elegí un cliente habilitado para cuenta corriente.");
    const byId = new Map(foundProducts.map((product) => [product.id, product]));
    const insufficient = data.items.flatMap((item) => {
      const product = byId.get(item.productoId)!;
      return product.stock < item.cantidad ? [{ productoId: item.productoId, solicitado: item.cantidad, disponible: product.stock }] : [];
    });
    if (insufficient.length) throw new ApiError(409, "STOCK_INSUFICIENTE", "No hay existencias suficientes para completar la venta.", insufficient);
    const lineItems = data.items.map((item) => {
      const product = byId.get(item.productoId)!;
      return { ...item, code: product.code, description: product.description, unitPrice: product.price, subtotal: product.price * item.cantidad };
    });
    const total = lineItems.reduce((sum, item) => sum + item.subtotal, 0);
    let amountReceived: number | null = null;
    let change = 0;
    if (data.pago.forma === "contado") {
      amountReceived = data.pago.montoRecibido ?? total;
      if (amountReceived < total) throw new ApiError(422, "MONTO_INSUFICIENTE", "El monto recibido no cubre el total.");
      change = amountReceived - total;
    }
    if (data.pago.forma === "cuenta_corriente" && customer) {
      const [balanceRow] = await tx.select({ balance: sql<number>`coalesce(sum(case when ${accountMovements.type} = 'debito' then ${accountMovements.amount} else -${accountMovements.amount} end), 0)` }).from(accountMovements).where(eq(accountMovements.customerId, customer.id));
      const currentBalance = Number(balanceRow?.balance ?? 0);
      const limit = customer.creditLimit;
      if (limit !== null && currentBalance + total > limit) throw new ApiError(422, "LIMITE_CREDITO_EXCEDIDO", "La venta supera el límite de crédito disponible.", { saldoActual: currentBalance, limite: limit, excedente: currentBalance + total - limit });
    }
    const number = await nextSequence(tx, "factura");
    const [invoice] = await tx.insert(invoices).values({
      pointOfSale: 1, number, customerId: customer?.id ?? null, userId: user.id,
      customerName: customer?.name ?? "Consumidor final", customerDocumentType: customer?.documentType ?? null,
      customerDocumentNumber: customer?.documentNumber ?? null, customerAddress: customer?.address ?? null, sellerName: user.name,
      date,
      total, paymentForm: data.pago.forma, amountReceived,
      cardType: data.pago.forma === "tarjeta" ? data.pago.tarjeta.tipo : null,
      cardBrand: data.pago.forma === "tarjeta" ? data.pago.tarjeta.marca : null,
      cardLastFour: data.pago.forma === "tarjeta" ? data.pago.tarjeta.ultimos4 : null,
    }).returning();
    for (const item of lineItems) {
      await moveStockInTransaction(tx, { productId: item.productoId, userId: user.id, invoiceId: invoice.id, type: "venta", quantity: item.cantidad, reason: `Factura ${formatInvoiceNumber(1, number)}`, createdAt: date });
      await tx.insert(invoiceItems).values({ invoiceId: invoice.id, productId: item.productoId, code: item.code, description: item.description, quantity: item.cantidad, unitPrice: item.unitPrice, subtotal: item.subtotal });
    }
    if (data.pago.forma === "cuenta_corriente" && customer) {
      await tx.insert(accountMovements).values({ customerId: customer.id, invoiceId: invoice.id, userId: user.id, type: "debito", amount: total, description: `Factura ${formatInvoiceNumber(1, number)}`, createdAt: date });
    }
    return {
      id: invoice.id, puntoVenta: 1, numero: number, numeroFormateado: formatInvoiceNumber(1, number),
      fecha: invoice.date, estado: "emitida", cliente: customer ? { id: customer.id, nombre: customer.name, tipoDoc: customer.documentType, nroDoc: customer.documentNumber, domicilio: customer.address } : null,
      vendedor: { id: user.id, nombre: user.name },
      items: lineItems.map((item) => ({ productoId: item.productoId, codigo: item.code, descripcion: item.description, cantidad: item.cantidad, precioUnitario: item.unitPrice, subtotal: item.subtotal })),
      total, pago: data.pago.forma === "contado" ? { forma: "contado", montoRecibido: amountReceived, vuelto: change } : data.pago.forma === "tarjeta" ? { forma: "tarjeta", tarjeta: data.pago.tarjeta } : { forma: "cuenta_corriente" },
      ...(data.pago.forma === "cuenta_corriente" && customer ? { saldoCliente: await currentBalanceInTransaction(tx, customer.id) } : {}),
    };
  });
}

async function currentBalanceInTransaction(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], customerId: number) {
  const [row] = await tx.select({ balance: sql<number>`coalesce(sum(case when ${accountMovements.type} = 'debito' then ${accountMovements.amount} else -${accountMovements.amount} end), 0)` }).from(accountMovements).where(eq(accountMovements.customerId, customerId));
  return Number(row?.balance ?? 0);
}

export async function listInvoices(params: { q?: string; from?: string; to?: string; customerId?: string; userId?: string; paymentForm?: string; status?: string } = {}) {
  await requireUser();
  const filters = [];
  if (params.from) filters.push(gte(invoices.date, new Date(`${params.from}T00:00:00-03:00`)));
  if (params.to) filters.push(lte(invoices.date, new Date(`${params.to}T23:59:59.999-03:00`)));
  if (params.customerId) filters.push(eq(invoices.customerId, Number(params.customerId)));
  if (params.userId) filters.push(eq(invoices.userId, Number(params.userId)));
  if (params.paymentForm) filters.push(eq(invoices.paymentForm, params.paymentForm as "contado" | "tarjeta" | "cuenta_corriente"));
  if (params.status) filters.push(eq(invoices.status, params.status as "emitida" | "anulada"));
  let rows = await db.select({ id: invoices.id, pointOfSale: invoices.pointOfSale, number: invoices.number, date: invoices.date, total: invoices.total, paymentForm: invoices.paymentForm, status: invoices.status, customerId: invoices.customerId, customerName: invoices.customerName, sellerName: invoices.sellerName, userId: invoices.userId }).from(invoices).where(and(...filters)).orderBy(desc(invoices.date));
  const q = params.q?.trim().toLowerCase();
  if (q) rows = rows.filter((row) => `${row.number} ${formatInvoiceNumber(row.pointOfSale, row.number)} ${row.customerName ?? "Consumidor final"}`.toLowerCase().includes(q));
  return { data: rows, totalIssued: rows.filter((row) => row.status === "emitida").reduce((total, row) => total + row.total, 0) };
}

export async function getInvoice(id: number) {
  await requireUser();
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  if (!invoice) throw new ApiError(404, "NO_ENCONTRADO", "No encontramos esa factura.");
  const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));
  const customer = invoice.customerId ? { id: invoice.customerId, name: invoice.customerName, documentType: invoice.customerDocumentType, documentNumber: invoice.customerDocumentNumber, address: invoice.customerAddress } : null;
  const cancellation = invoice.status === "anulada" && invoice.cancelledBy ? await db.select({ user: users.name }).from(users).where(eq(users.id, invoice.cancelledBy)).then((rows) => rows[0]?.user ?? "") : null;
  return {
    id: invoice.id, pointOfSale: invoice.pointOfSale, number: invoice.number, formattedNumber: formatInvoiceNumber(invoice.pointOfSale, invoice.number), date: invoice.date,
    total: invoice.total, paymentForm: invoice.paymentForm, status: invoice.status, customer, seller: { id: invoice.userId, name: invoice.sellerName },
    items: items.map((item) => ({ productId: item.productId, code: item.code, description: item.description, quantity: item.quantity, unitPrice: item.unitPrice, subtotal: item.subtotal })),
    payment: invoice.paymentForm === "contado" ? { form: "contado", amountReceived: invoice.amountReceived, change: (invoice.amountReceived ?? invoice.total) - invoice.total } : invoice.paymentForm === "tarjeta" ? { form: "tarjeta", cardType: invoice.cardType, cardBrand: invoice.cardBrand, lastFour: invoice.cardLastFour } : { form: "cuenta_corriente" },
    ...(invoice.status === "anulada" ? { cancellation: { date: invoice.cancelledAt, user: String(cancellation ?? ""), reason: invoice.cancellationReason } } : {}),
  };
}

export async function cancelInvoice(id: number, input: unknown, asUser?: AuthenticatedUser) {
  const user = await requireAdmin(asUser);
  const parsed = invoiceCancellationSchema.safeParse(input);
  if (!parsed.success) throw new ApiError(422, "VALIDACION", "El motivo de anulación es obligatorio.");
  return db.transaction(async (tx) => {
    const [invoice] = await tx.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    if (!invoice) throw new ApiError(404, "NO_ENCONTRADO", "No encontramos esa factura.");
    if (invoice.status === "anulada") throw new ApiError(409, "FACTURA_ANULADA", "La factura ya está anulada.");
    const [updated] = await tx.update(invoices).set({ status: "anulada", cancellationReason: parsed.data.motivo, cancelledAt: new Date(), cancelledBy: user.id }).where(and(eq(invoices.id, id), eq(invoices.status, "emitida"))).returning({ id: invoices.id });
    if (!updated) throw new ApiError(409, "FACTURA_ANULADA", "La factura ya está anulada.");
    const items = await tx.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    for (const item of items) {
      await moveStockInTransaction(tx, { productId: item.productId, userId: user.id, invoiceId: id, type: "anulacion", quantity: item.quantity, reason: parsed.data.motivo });
    }
    if (invoice.paymentForm === "cuenta_corriente" && invoice.customerId) {
      await tx.insert(accountMovements).values({ customerId: invoice.customerId, invoiceId: id, userId: user.id, type: "credito", amount: invoice.total, description: `Anulación factura ${formatInvoiceNumber(invoice.pointOfSale, invoice.number)}` });
    }
    return getInvoiceInTransaction(tx, id);
  });
}

async function getInvoiceInTransaction(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], id: number) {
  const [invoice] = await tx.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  return { id: invoice.id, numeroFormateado: formatInvoiceNumber(invoice.pointOfSale, invoice.number), estado: invoice.status, motivoAnulacion: invoice.cancellationReason, fechaAnulacion: invoice.cancelledAt };
}
