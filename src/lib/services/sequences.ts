import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { sequences } from "@/lib/db/schema";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export async function nextSequence(tx: Transaction, kind: "factura" | "recibo") {
  await tx.insert(sequences).values({ kind, value: 0 }).onConflictDoNothing();
  const [sequence] = await tx.update(sequences).set({ value: sql`${sequences.value} + 1` }).where(eq(sequences.kind, kind)).returning({ value: sequences.value });
  return sequence.value;
}
