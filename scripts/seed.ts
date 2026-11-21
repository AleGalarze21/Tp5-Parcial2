import "dotenv/config";
import { hash } from "bcryptjs";
import { count, eq, inArray } from "drizzle-orm";
import { db } from "../src/lib/db";
import { categories, customers, invoices, products, users } from "../src/lib/db/schema";
import { createCategory } from "../src/lib/services/categories";
import { createCustomer, customerBalance, registerPayment } from "../src/lib/services/customers";
import { createInvoice } from "../src/lib/services/invoices";
import { createProduct } from "../src/lib/services/products";

async function ensureUser(email: string, name: string, password: string, role: "admin" | "vendedor") {
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(users).values({ email, name, passwordHash: await hash(password, 10), role, active: true }).returning();
  return created;
}

const catalogOnly = process.env.SEED_CATALOG_ONLY === "true";
const [existingAdmin] = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
const admin = existingAdmin ?? await ensureUser("laura@nexusgpu.test", "Laura Méndez", "Admin123!", "admin");
const [existingSeller] = catalogOnly ? [undefined] : await db.select().from(users).where(eq(users.role, "vendedor")).limit(1);
const seller = catalogOnly ? undefined : existingSeller ?? await ensureUser("pablo@nexusgpu.test", "Pablo Ruiz", "Vendedor123!", "vendedor");
const categoryNames = ["Placas de video", "Procesadores", "Memoria y almacenamiento", "Equipos para IA", "Refrigeración y fuentes"];
const categoryIds: number[] = [];
for (const name of categoryNames) {
  const [existing] = await db.select().from(categories).where(eq(categories.name, name)).limit(1);
  const category = existing ?? await createCategory({ name }, admin);
  categoryIds.push(category.id);
}
await db.update(categories).set({ active: false }).where(inArray(categories.name, ["Herramientas", "Electricidad", "Pinturería", "Plomería", "Jardín"]));

const productsCatalog = [
  "GeForce RTX 5090 32 GB GDDR7", "GeForce RTX 5080 16 GB GDDR7", "GeForce RTX 5070 Ti 16 GB", "GeForce RTX 5070 12 GB", "GeForce RTX 5060 Ti 16 GB", "GeForce RTX 5060 8 GB",
  "AMD Ryzen 9 9950X 16 núcleos", "AMD Ryzen 7 9800X3D", "AMD Ryzen 5 9600X", "Intel Core Ultra 9 285K", "Intel Core Ultra 7 265K", "Intel Core Ultra 5 245K",
  "Memoria DDR5 64 GB 6000 MHz", "Memoria DDR5 32 GB 6000 MHz", "SSD NVMe Gen5 2 TB", "SSD NVMe Gen4 2 TB", "SSD NVMe Gen4 1 TB", "Disco externo SSD 2 TB",
  "Workstation IA Ryzen Threadripper", "Workstation IA dual GPU RTX", "Servidor IA 4x GPU 96 GB", "Estación de inferencia compacta", "Kit de desarrollo NVIDIA Jetson", "Acelerador IA PCIe 48 GB",
  "Fuente 1200 W 80+ Platinum", "Fuente 1000 W 80+ Gold", "Refrigeración líquida 360 mm", "Refrigeración líquida 240 mm", "Gabinete full tower airflow", "Gabinete workstation E-ATX",
];
const basePrices = [279990000, 189990000, 149990000, 109990000, 89990000];
const productIds: number[] = [];
for (let i = 0; i < productsCatalog.length; i++) {
  const code = `PR-${String(i + 1).padStart(3, "0")}`;
  const categoryIndex = Math.floor(i / 6);
  const price = basePrices[categoryIndex] + (i % 6) * (categoryIndex === 0 ? 17500000 : 6500000);
  const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.code, code)).limit(1);
  if (existing) {
    await db.update(products).set({ description: productsCatalog[i], categoryId: categoryIds[categoryIndex], price, minStock: 3, active: true }).where(eq(products.id, existing.id));
    productIds.push(existing.id);
  } else {
    const created = await createProduct({ code, description: productsCatalog[i], categoryId: categoryIds[categoryIndex], price, minStock: 3, initialStock: 12 }, admin);
    productIds.push(created.id);
  }
}

const customerIds: number[] = [];
const customerNames = ["Mariana López", "Carlos Ramírez", "Lucía Fernández", "Diego González", "Sofía Martínez", "Andrés Torres", "Valentina Ruiz", "Miguel Castro", "Camila Herrera", "Nicolás Díaz"];
for (let i = 0; !catalogOnly && i < customerNames.length; i++) {
  const documentNumber = String(28456123 + i * 15731);
  const [existing] = await db.select({ id: customers.id }).from(customers).where(eq(customers.documentNumber, documentNumber)).limit(1);
  const customer = existing ? { id: existing.id } : await createCustomer({ documentType: "DNI", documentNumber, name: customerNames[i], address: `${300 + i * 12} San Martín`, phone: `381 455-${String(2210 + i).padStart(4, "0")}`, email: `cliente${i + 1}@correo.test`, currentAccount: i < 7, creditLimit: i === 0 ? null : 5000000000 }, admin);
  if (existing) await db.update(customers).set({ currentAccount: i < 7, creditLimit: i === 0 ? null : 5000000000 }).where(eq(customers.id, existing.id));
  customerIds.push(customer.id);
}

const [invoiceCount] = await db.select({ total: count() }).from(invoices);
if (!catalogOnly && seller && invoiceCount.total < 50) {
  for (let i = Number(invoiceCount.total); i < 50; i++) {
    const daysAgo = (29 - (i % 30));
    const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - (i % 10) * 31 * 60 * 1000);
    const firstProduct = productIds[(i * 3) % productIds.length];
    const secondProduct = productIds[(i * 3 + 7) % productIds.length];
    const items = [{ productoId: firstProduct, cantidad: (i % 5 === 0 ? 2 : 1) }, { productoId: secondProduct, cantidad: 1 }];
    let pago: Record<string, unknown>;
    let clienteId: number | null = null;
    if (i % 4 === 0) {
      clienteId = customerIds[(i / 4) % 7];
      pago = { forma: "cuenta_corriente" };
    } else if (i % 4 === 1) {
      clienteId = customerIds[i % customerIds.length];
      pago = { forma: "tarjeta", tarjeta: { tipo: i % 2 ? "debito" : "credito", marca: i % 3 ? "Visa" : "Mastercard", ultimos4: String(1020 + i).slice(-4) } };
    } else {
      clienteId = i % 3 === 0 ? customerIds[i % customerIds.length] : null;
      pago = { forma: "contado" };
    }
    await createInvoice({ clienteId, items, pago }, seller, date);
    if (i % 8 === 0 && clienteId !== null) {
      const balance = await customerBalance(clienteId);
      if (balance > 0) await registerPayment(clienteId, { amount: Math.min(balance, 95000), method: i % 2 ? "transferencia" : "efectivo", note: "Pago de prueba" }, seller, new Date(date.getTime() + 2 * 60 * 60 * 1000));
    }
  }
}

console.log("Datos de prueba listos.");
if (!catalogOnly) {
  console.log("Admin: laura@nexusgpu.test / Admin123!");
  console.log("Vendedor: pablo@nexusgpu.test / Vendedor123!");
}
