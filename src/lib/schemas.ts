import { z } from "zod";

export const productCreateSchema = z.object({
  code: z.string().trim().min(1, "Ingresá un código.").max(32),
  description: z.string().trim().min(2, "Ingresá una descripción.").max(160),
  categoryId: z.number().int().positive(),
  price: z.number().int().nonnegative(),
  minStock: z.number().int().nonnegative(),
  initialStock: z.number().int().nonnegative().optional().default(0),
}).strict();

export const productPatchSchema = z.object({
  code: z.string().trim().min(1).max(32).optional(),
  description: z.string().trim().min(2).max(160).optional(),
  categoryId: z.number().int().positive().optional(),
  price: z.number().int().nonnegative().optional(),
  minStock: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
}).strict();

export const stockMovementSchema = z.object({
  type: z.enum(["ingreso", "egreso"]),
  quantity: z.number().int().positive(),
  reason: z.string().trim().min(2).max(100),
  note: z.string().trim().max(250).optional(),
}).strict();

export const customerSchema = z.object({
  documentType: z.enum(["DNI", "CUIT"]),
  documentNumber: z.string().trim().min(5).max(20),
  name: z.string().trim().min(2).max(140),
  address: z.string().trim().max(180).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z.union([z.email(), z.literal("")]).optional().nullable(),
  currentAccount: z.boolean().optional().default(false),
  creditLimit: z.number().int().positive().optional().nullable(),
}).strict();

export const customerPatchSchema = customerSchema.partial().extend({ active: z.boolean().optional() }).strict();

export const categoryCreateSchema = z.object({ name: z.string().trim().min(2).max(80) }).strict();
export const categoryPatchSchema = z.object({ name: z.string().trim().min(2).max(80).optional(), active: z.boolean().optional() }).strict();

export const userCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().transform((value) => value.toLowerCase()),
  role: z.enum(["admin", "vendedor"]),
  password: z.string().min(8).max(100),
}).strict();

export const userPatchSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.email().transform((value) => value.toLowerCase()).optional(),
  role: z.enum(["admin", "vendedor"]).optional(),
  active: z.boolean().optional(),
}).strict();

export const passwordChangeSchema = z.object({ actual: z.string().min(1), nueva: z.string().min(8).max(100) }).strict();

export const invoicePaymentSchema = z.discriminatedUnion("forma", [
  z.object({ forma: z.literal("contado"), montoRecibido: z.number().int().nonnegative().optional() }).strict(),
  z.object({ forma: z.literal("tarjeta"), tarjeta: z.object({ tipo: z.enum(["debito", "credito"]), marca: z.string().trim().min(2).max(30), ultimos4: z.string().regex(/^\d{4}$/) }).strict() }).strict(),
  z.object({ forma: z.literal("cuenta_corriente") }).strict(),
]);

export const invoiceSchema = z.object({
  clienteId: z.number().int().positive().nullable(),
  items: z.array(z.object({ productoId: z.number().int().positive(), cantidad: z.number().int().positive() }).strict()).min(1),
  pago: invoicePaymentSchema,
}).strict().refine((value) => new Set(value.items.map((item) => item.productoId)).size === value.items.length, { message: "No repitas productos en los renglones.", path: ["items"] });

export const invoiceCancellationSchema = z.object({ motivo: z.string().trim().min(3).max(250) }).strict();

export const accountPaymentSchema = z.object({
  amount: z.number().int().positive(),
  method: z.enum(["efectivo", "transferencia", "tarjeta_debito"]),
  note: z.string().trim().max(240).optional(),
}).strict();
