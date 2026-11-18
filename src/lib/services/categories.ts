import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { ApiError } from "@/lib/api-error";
import { requireAdmin, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";

export async function listCategories() {
  await requireUser();
  return db.select().from(categories).where(eq(categories.active, true)).orderBy(asc(categories.name));
}

export async function createCategory(input: unknown) {
  await requireAdmin();
  const parsed = z.object({ name: z.string().trim().min(2).max(80) }).safeParse(input);
  if (!parsed.success) throw new ApiError(422, "VALIDACION", "El nombre debe tener entre 2 y 80 caracteres.");
  try {
    const [category] = await db.insert(categories).values({ name: parsed.data.name }).returning();
    return category;
  } catch (error) {
    if (String(error).toLowerCase().includes("unique")) throw new ApiError(409, "NOMBRE_DUPLICADO", "Ya existe una categoría con ese nombre.");
    throw error;
  }
}

export async function updateCategory(id: number, input: unknown) {
  await requireAdmin();
  const parsed = z.object({ name: z.string().trim().min(2).max(80).optional(), active: z.boolean().optional() }).strict().safeParse(input);
  if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) throw new ApiError(422, "VALIDACION", "Indicá un nombre o el estado de la categoría.");
  if (parsed.data.active === false) {
    const [inUse] = await db.select({ id: products.id }).from(products).where(and(eq(products.categoryId, id), eq(products.active, true))).limit(1);
    if (inUse) throw new ApiError(409, "CATEGORIA_EN_USO", "La categoría tiene productos activos.");
  }
  try {
    const [updated] = await db.update(categories).set(parsed.data).where(eq(categories.id, id)).returning();
    if (!updated) throw new ApiError(404, "NO_ENCONTRADO", "No encontramos esa categoría.");
    return updated;
  } catch (error) {
    if (String(error).toLowerCase().includes("unique")) throw new ApiError(409, "NOMBRE_DUPLICADO", "Ya existe una categoría con ese nombre.");
    throw error;
  }
}
