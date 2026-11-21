import "dotenv/config";
import { db } from "../src/lib/db";
import {
  accountMovements,
  categories,
  customers,
  invoiceItems,
  invoices,
  payments,
  products,
  sequences,
  stockMovements,
} from "../src/lib/db/schema";

if (process.env.RESET_DATABASE !== "true") {
  throw new Error("Para borrar y recrear los datos, definí RESET_DATABASE=true en esta sesión.");
}

process.env.SEED_CATALOG_ONLY = "false";

await db.delete(accountMovements);
await db.delete(payments);
await db.delete(stockMovements);
await db.delete(invoiceItems);
await db.delete(invoices);
await db.delete(products);
await db.delete(categories);
await db.delete(customers);
await db.delete(sequences);

console.log("Datos anteriores eliminados; cargando el dataset nuevo de NEXUS GPU.");
await import("./seed");
