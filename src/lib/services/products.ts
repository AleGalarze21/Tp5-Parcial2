import { and, asc, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { z } from "zod";
import { ApiError } from "@/lib/api-error";
import { db } from "@/lib/db";
import { categories, products, stockMovements, users } from "@/lib/db/schema";
import { requireAdmin, requireUser, type AuthenticatedUser } from "@/lib/auth";

const money = z.number().int().nonnegative();
const productCreateSchema = z.object({
  code: z.string().trim().min(1, "Ingresá un código.").max(32),
  description: z.string().trim().min(2, "Ingresá una descripción.").max(160),
  categoryId: z.number().int().positive(),
  price: money,
  minStock: z.number().int().nonnegative(),
  initialStock: z.number().int().nonnegative().optional().default(0),
}).strict();
const productPatchSchema = z.object({
  code: z.string().trim().min(1).max(32).optional(),
  description: z.string().trim().min(2).max(160).optional(),
  categoryId: z.number().int().positive().optional(),
  price: money.optional(),
  minStock: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
}).strict();
const movementSchema = z.object({
  type: z.enum(["ingreso", "egreso"]),
  quantity: z.number().int().positive(),
  reason: z.string().trim().min(2).max(100),
  note: z.string().trim().max(250).optional(),
});

export async function listProducts(params: { q?: string; categoryId?: string; belowMinimum?: boolean; active?: "true" | "false" | "all" } = {}) {
  const user = await requireUser();
  const filters = [];
  if ((params.active === "false" || params.active === "all") && user.role !== "admin") throw new ApiError(403, "SIN_PERMISO", "Solo administración puede consultar productos inactivos.");
  if (params.active === "false") filters.push(eq(products.active, false));
  else if (params.active === "all" && user.role !== "admin") filters.push(eq(products.active, true));
  else if (params.active !== "all") filters.push(eq(products.active, true));
  if (params.q?.trim()) {
    const term = `%${params.q.trim()}%`;
    filters.push(or(like(products.code, term), like(products.description, term))!);
  }
  if (params.categoryId) filters.push(eq(products.categoryId, Number(params.categoryId)));
  if (params.belowMinimum) filters.push(lte(products.stock, products.minStock));
  return db.select({ id: products.id, code: products.code, description: products.description, categoryId: products.categoryId, category: categories.name, price: products.price, stock: products.stock, minStock: products.minStock, belowMinimum: sql<boolean>`${products.stock} <= ${products.minStock}`, active: products.active, createdAt: products.createdAt }).from(products).innerJoin(categories, eq(products.categoryId, categories.id)).where(and(...filters)).orderBy(asc(products.description));
}

export async function getProduct(id: number) {
  await requireUser();
  const [product] = await db.select({ id: products.id, code: products.code, description: products.description, categoryId: products.categoryId, category: categories.name, price: products.price, stock: products.stock, minStock: products.minStock, active: products.active, createdAt: products.createdAt }).from(products).innerJoin(categories, eq(products.categoryId, categories.id)).where(eq(products.id, id)).limit(1);
  if (!product) throw new ApiError(404, "NO_ENCONTRADO", "No encontramos ese producto.");
  return product;
}

export async function createProduct(input: unknown, asUser?: AuthenticatedUser) {
  const user = await requireAdmin(asUser);
  const parsed = productCreateSchema.safeParse(input);
  if (!parsed.success) throw new ApiError(422, "VALIDACION", "Revisá los datos del producto.", parsed.error.issues.map((issue) => ({ campo: String(issue.path[0] ?? "producto"), mensaje: issue.message })));
  const data = parsed.data;
  try {
    return await db.transaction(async (tx) => {
      const [category] = await tx.select().from(categories).where(and(eq(categories.id, data.categoryId), eq(categories.active, true))).limit(1);
      if (!category) throw new ApiError(422, "VALIDACION", "Elegí una categoría activa.");
      const [created] = await tx.insert(products).values({ code: data.code, description: data.description, categoryId: data.categoryId, price: data.price, minStock: data.minStock, stock: data.initialStock }).returning();
      if (data.initialStock > 0) await tx.insert(stockMovements).values({ productId: created.id, userId: user.id, type: "ingreso", quantity: data.initialStock, resultingStock: data.initialStock, reason: "Stock inicial" });
      return created;
    });
  } catch (error) {
    if (String(error).toLowerCase().includes("unique")) throw new ApiError(409, "CODIGO_DUPLICADO", "Ese código ya está registrado.");
    throw error;
  }
}

export async function updateProduct(id: number, input: unknown) {
  await requireAdmin();
  const parsed = productPatchSchema.safeParse(input);
  if (!parsed.success) throw new ApiError(422, "VALIDACION", "Revisá los datos del producto.", parsed.error.issues.map((issue) => ({ campo: String(issue.path[0] ?? "producto"), mensaje: issue.message })));
  if (Object.keys(parsed.data).length === 0) throw new ApiError(422, "VALIDACION", "Indicá al menos un campo para modificar.");
  if (parsed.data.categoryId) {
    const [category] = await db.select({ id: categories.id }).from(categories).where(and(eq(categories.id, parsed.data.categoryId), eq(categories.active, true))).limit(1);
    if (!category) throw new ApiError(422, "VALIDACION", "Elegí una categoría activa.");
  }
  try {
    const [updated] = await db.update(products).set(parsed.data).where(eq(products.id, id)).returning();
    if (!updated) throw new ApiError(404, "NO_ENCONTRADO", "No encontramos ese producto.");
    return updated;
  } catch (error) {
    if (String(error).toLowerCase().includes("unique")) throw new ApiError(409, "CODIGO_DUPLICADO", "Ese código ya está registrado.");
    throw error;
  }
}

export async function moveStock(id: number, input: unknown) {
  const user = await requireAdmin();
  const parsed = movementSchema.safeParse(input);
  if (!parsed.success) throw new ApiError(422, "VALIDACION", "Revisá los datos del movimiento.", parsed.error.issues.map((issue) => ({ campo: String(issue.path[0] ?? "movimiento"), mensaje: issue.message })));
  const { type, quantity, reason } = parsed.data;
  const signedQuantity = type === "ingreso" ? quantity : -quantity;
  return db.transaction(async (tx) => {
    const [updated] = await tx.update(products).set({ stock: sql`${products.stock} + ${signedQuantity}` }).where(and(eq(products.id, id), ...(type === "egreso" ? [gte(products.stock, quantity)] : []))).returning({ stock: products.stock });
    if (!updated) {
      const [existing] = await tx.select({ id: products.id }).from(products).where(eq(products.id, id)).limit(1);
      if (!existing) throw new ApiError(404, "NO_ENCONTRADO", "No encontramos ese producto.");
      throw new ApiError(409, "STOCK_INSUFICIENTE", "El egreso supera la existencia disponible.");
    }
    const [movement] = await tx.insert(stockMovements).values({ productId: id, userId: user.id, type, quantity: signedQuantity, resultingStock: updated.stock, reason }).returning();
    return movement;
  });
}

export async function listStockMovements(productId?: number) {
  await requireUser();
  const where = productId ? eq(stockMovements.productId, productId) : undefined;
  return db.select({ id: stockMovements.id, productId: products.id, code: products.code, description: products.description, type: stockMovements.type, quantity: stockMovements.quantity, resultingStock: stockMovements.resultingStock, reason: stockMovements.reason, createdAt: stockMovements.createdAt, user: users.name }).from(stockMovements).innerJoin(products, eq(stockMovements.productId, products.id)).innerJoin(users, eq(stockMovements.userId, users.id)).where(where).orderBy(desc(stockMovements.createdAt)).limit(100);
}

