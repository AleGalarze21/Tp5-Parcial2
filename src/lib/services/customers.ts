import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import { z } from "zod";
import { ApiError } from "@/lib/api-error";
import { requireUser, type AuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { accountMovements, customers, invoices, payments, users } from "@/lib/db/schema";
import { nextSequence } from "@/lib/services/sequences";
import { accountPaymentSchema, customerPatchSchema, customerSchema } from "@/lib/schemas";

const balanceExpression = sql<number>`coalesce(sum(case when ${accountMovements.type} = 'debito' then ${accountMovements.amount} else -${accountMovements.amount} end), 0)`;

export async function listCustomers(params: { q?: string; withDebt?: boolean; order?: "balance" | "name" } = {}) {
  await requireUser();
  const filters = [eq(customers.active, true)];
  const term = params.q?.trim();
  if (term) {
    const compact = term.replace(/[.\-\s]/g, "");
    filters.push(or(like(customers.name, `%${term}%`), like(sql`replace(replace(replace(${customers.documentNumber}, '.', ''), '-', ''), ' ', '')`, `%${compact}%`))!);
  }
  const rows = await db.select({
    id: customers.id, documentType: customers.documentType, documentNumber: customers.documentNumber, name: customers.name,
    phone: customers.phone, email: customers.email, address: customers.address, currentAccount: customers.currentAccount,
    creditLimit: customers.creditLimit, active: customers.active, balance: balanceExpression,
  }).from(customers).leftJoin(accountMovements, eq(accountMovements.customerId, customers.id)).where(and(...filters)).groupBy(customers.id).orderBy(params.order === "balance" ? desc(balanceExpression) : asc(customers.name));
  const data = params.withDebt ? rows.filter((row) => row.balance > 0) : rows;
  return { data, totalDebt: data.reduce((total, customer) => total + Math.max(0, customer.balance), 0) };
}

export async function getCustomer(id: number) {
  await requireUser();
  const [customer] = await db.select({
    id: customers.id, documentType: customers.documentType, documentNumber: customers.documentNumber,
    name: customers.name, address: customers.address, phone: customers.phone, email: customers.email,
    currentAccount: customers.currentAccount, creditLimit: customers.creditLimit, active: customers.active,
    balance: balanceExpression,
  }).from(customers).leftJoin(accountMovements, eq(accountMovements.customerId, customers.id)).where(eq(customers.id, id)).groupBy(customers.id).limit(1);
  if (!customer) throw new ApiError(404, "NO_ENCONTRADO", "No encontramos ese cliente.");
  const lastInvoices = await db.select({ id: invoices.id, number: invoices.number, pointOfSale: invoices.pointOfSale, date: invoices.date, total: invoices.total, status: invoices.status }).from(invoices).where(eq(invoices.customerId, id)).orderBy(desc(invoices.date)).limit(6);
  return { ...customer, lastInvoices };
}

function validationError(error: z.ZodError) {
  return new ApiError(422, "VALIDACION", "Revisá los datos del cliente.", error.issues.map((issue) => ({ campo: String(issue.path[0] ?? "cliente"), mensaje: issue.message })));
}

export async function createCustomer(input: unknown, asUser?: AuthenticatedUser) {
  await requireUser(asUser);
  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) throw validationError(parsed.error);
  const data = parsed.data;
  try {
    const [customer] = await db.insert(customers).values({ ...data, email: data.email || null, address: data.address || null, phone: data.phone || null }).returning();
    return customer;
  } catch (error) {
    if (String(error).toLowerCase().includes("unique")) throw new ApiError(409, "DOCUMENTO_DUPLICADO", "Ya existe un cliente con ese tipo y número de documento.");
    throw error;
  }
}

export async function updateCustomer(id: number, input: unknown) {
  await requireUser();
  const parsed = customerPatchSchema.safeParse(input);
  if (!parsed.success) throw validationError(parsed.error);
  if (Object.keys(parsed.data).length === 0) throw new ApiError(422, "VALIDACION", "Indicá al menos un campo para modificar.");
  const [existing] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  if (!existing) throw new ApiError(404, "NO_ENCONTRADO", "No encontramos ese cliente.");
  const balance = await customerBalance(id);
  if (balance !== 0 && (parsed.data.active === false || parsed.data.currentAccount === false)) throw new ApiError(422, "SALDO_PENDIENTE", "No se puede desactivar la cuenta con saldo pendiente.");
  try {
    const [updated] = await db.update(customers).set({ ...parsed.data, email: parsed.data.email === "" ? null : parsed.data.email }).where(eq(customers.id, id)).returning();
    return updated;
  } catch (error) {
    if (String(error).toLowerCase().includes("unique")) throw new ApiError(409, "DOCUMENTO_DUPLICADO", "Ya existe un cliente con ese tipo y número de documento.");
    throw error;
  }
}

export async function customerBalance(customerId: number, executor: typeof db = db) {
  const [row] = await executor.select({ balance: balanceExpression }).from(accountMovements).where(eq(accountMovements.customerId, customerId));
  return Number(row?.balance ?? 0);
}

export async function listAccountMovements(customerId: number, from?: string, to?: string) {
  await requireUser();
  const [customer] = await db.select({ id: customers.id, name: customers.name }).from(customers).where(eq(customers.id, customerId)).limit(1);
  if (!customer) throw new ApiError(404, "NO_ENCONTRADO", "No encontramos ese cliente.");
  const all = await db.select().from(accountMovements).where(eq(accountMovements.customerId, customerId)).orderBy(asc(accountMovements.createdAt), asc(accountMovements.id));
  const fromTime = from ? new Date(`${from}T00:00:00-03:00`).getTime() : undefined;
  const toTime = to ? new Date(`${to}T00:00:00-03:00`).getTime() + 24 * 60 * 60 * 1000 : undefined;
  const before = fromTime !== undefined ? all.filter((row) => row.createdAt.getTime() < fromTime).reduce((sum, row) => sum + (row.type === "debito" ? row.amount : -row.amount), 0) : 0;
  let running = before;
  const filtered = all.filter((row) => (fromTime === undefined || row.createdAt.getTime() >= fromTime) && (toTime === undefined || row.createdAt.getTime() < toTime));
  const movements = filtered.map((row) => {
    running += row.type === "debito" ? row.amount : -row.amount;
    return { id: row.id, date: row.createdAt, type: row.type, amount: row.amount, description: row.description, invoiceId: row.invoiceId, paymentId: row.paymentId, balance: running };
  });
  return { customer, previousBalance: before, movements, balance: await customerBalance(customerId) };
}

export async function registerPayment(customerId: number, input: unknown, asUser?: AuthenticatedUser, date = new Date()) {
  const user = await requireUser(asUser);
  const parsed = accountPaymentSchema.safeParse(input);
  if (!parsed.success) throw new ApiError(422, "VALIDACION", "Revisá el importe y el medio de pago.", parsed.error.issues.map((issue) => ({ campo: String(issue.path[0] ?? "pago"), mensaje: issue.message })));
  return db.transaction(async (tx) => {
    const [customer] = await tx.select().from(customers).where(eq(customers.id, customerId)).limit(1);
    if (!customer || !customer.active) throw new ApiError(404, "NO_ENCONTRADO", "No encontramos ese cliente.");
    if (!customer.currentAccount) throw new ApiError(422, "CUENTA_CORRIENTE_NO_HABILITADA", "El cliente no tiene una cuenta corriente habilitada.");
    const [currentBalance] = await tx.select({ balance: balanceExpression }).from(accountMovements).where(eq(accountMovements.customerId, customerId));
    const balance = Number(currentBalance?.balance ?? 0);
    if (parsed.data.amount > balance) throw new ApiError(422, "PAGO_SUPERA_DEUDA", "El pago no puede superar la deuda actual.");
    const number = await nextSequence(tx, "recibo");
    const [payment] = await tx.insert(payments).values({ receiptNumber: number, customerId, userId: user.id, amount: parsed.data.amount, method: parsed.data.method, note: parsed.data.note || null, createdAt: date }).returning();
    await tx.insert(accountMovements).values({ customerId, paymentId: payment.id, userId: user.id, type: "credito", amount: payment.amount, description: `Recibo R 0001-${String(number).padStart(8, "0")}`, createdAt: date });
    return { id: payment.id, receiptNumber: `R 0001-${String(number).padStart(8, "0")}`, date: payment.createdAt, customer: { id: customer.id, name: customer.name }, amount: payment.amount, method: payment.method, user: { id: user.id, name: user.name }, balance: balance - payment.amount };
  });
}

export async function getPayment(id: number) {
  await requireUser();
  const [payment] = await db.select({ id: payments.id, receiptNumber: payments.receiptNumber, date: payments.createdAt, customerId: customers.id, customer: customers.name, amount: payments.amount, method: payments.method, note: payments.note, user: users.name }).from(payments).innerJoin(customers, eq(payments.customerId, customers.id)).innerJoin(users, eq(payments.userId, users.id)).where(eq(payments.id, id)).limit(1);
  if (!payment) throw new ApiError(404, "NO_ENCONTRADO", "No encontramos ese recibo.");
  return { ...payment, formattedNumber: `R 0001-${String(payment.receiptNumber).padStart(8, "0")}` };
}
