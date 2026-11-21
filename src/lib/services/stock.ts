import { and, eq, gte, sql } from "drizzle-orm";
import { ApiError } from "@/lib/api-error";
import { db } from "@/lib/db";
import { products, stockMovements } from "@/lib/db/schema";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type StockMovementType = "venta" | "anulacion" | "ingreso" | "egreso";

/** RF-P4, RF-P5, RF-V6, RF-V9: única operación que modifica existencias y registra su movimiento. */
export async function moveStockInTransaction(
  tx: Transaction,
  input: {
    productId: number;
    userId: number;
    type: StockMovementType;
    quantity: number;
    reason: string;
    invoiceId?: number;
    createdAt?: Date;
  },
) {
  const quantity = Math.abs(input.quantity);
  const signedQuantity = input.type === "ingreso" || input.type === "anulacion" ? quantity : -quantity;
  const [updated] = await tx.update(products)
    .set({ stock: sql`${products.stock} + ${signedQuantity}` })
    .where(and(
      eq(products.id, input.productId),
      ...(signedQuantity < 0 ? [gte(products.stock, quantity)] : []),
    ))
    .returning({ stock: products.stock });

  if (!updated) {
    const [existing] = await tx.select({ id: products.id }).from(products).where(eq(products.id, input.productId)).limit(1);
    if (!existing) throw new ApiError(404, "NO_ENCONTRADO", "No encontramos ese producto.");
    throw new ApiError(409, "STOCK_INSUFICIENTE", "El movimiento supera la existencia disponible.");
  }

  const [movement] = await tx.insert(stockMovements).values({
    productId: input.productId,
    userId: input.userId,
    invoiceId: input.invoiceId ?? null,
    type: input.type,
    quantity: signedQuantity,
    resultingStock: updated.stock,
    reason: input.reason,
    ...(input.createdAt ? { createdAt: input.createdAt } : {}),
  }).returning();

  return { stock: updated.stock, movement };
}
