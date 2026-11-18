import { hash } from "bcryptjs";
import { count, eq } from "drizzle-orm";
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

const admin = await ensureUser("laura@ferreteria.test", "Laura Méndez", "Admin123!", "admin");
const seller = await ensureUser("pablo@ferreteria.test", "Pablo Ruiz", "Vendedor123!", "vendedor");
const categoryNames = ["Herramientas", "Electricidad", "Pinturería", "Plomería", "Jardín"];
const categoryIds: number[] = [];
for (const name of categoryNames) {
  const [existing] = await db.select().from(categories).where(eq(categories.name, name)).limit(1);
  const category = existing ?? await createCategory({ name }, admin);
  categoryIds.push(category.id);
}

const productsCatalog = [
  "Martillo carpintero 500 g", "Destornillador plano 6 mm", "Pinza universal 8 pulgadas", "Taladro percutor 650 W", "Juego de llaves combinadas",
  "Cinta aisladora 20 m", "Cable unipolar 2.5 mm", "Lámpara LED 12 W", "Térmica bipolar 20 A", "Toma doble 10 A",
  "Látex interior blanco 4 L", "Pincel cerda 2 pulgadas", "Rodillo para pared 22 cm", "Enduido interior 1 kg", "Lija para madera grano 120",
  "Caño PVC 40 mm", "Codo PVC 90 grados", "Cinta teflón 12 m", "Canilla monocomando", "Sifón flexible universal",
  "Manguera jardín 15 m", "Pala de punta reforzada", "Tijera de podar", "Maceta plástica 30 cm", "Regadera 5 L",
  "Llave francesa 10 pulgadas", "Sierra manual 20 pulgadas", "Guantes moteados", "Nivel de burbuja 40 cm", "Mecha para pared 8 mm",
];
const productIds: number[] = [];
for (let i = 0; i < productsCatalog.length; i++) {
  const code = `PR-${String(i + 1).padStart(3, "0")}`;
  const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.code, code)).limit(1);
  const created = existing ?? await createProduct({ code, description: productsCatalog[i], categoryId: categoryIds[Math.floor(i / 6)], price: 280000 + (i % 9) * 137000, minStock: 8, initialStock: 50 }, admin);
  productIds.push(created.id);
}

const customerIds: number[] = [];
const customerNames = ["Mariana López", "Carlos Ramírez", "Lucía Fernández", "Diego González", "Sofía Martínez", "Andrés Torres", "Valentina Ruiz", "Miguel Castro", "Camila Herrera", "Nicolás Díaz"];
for (let i = 0; i < customerNames.length; i++) {
  const documentNumber = String(28456123 + i * 15731);
  const [existing] = await db.select({ id: customers.id }).from(customers).where(eq(customers.documentNumber, documentNumber)).limit(1);
  const customer = existing ? { id: existing.id } : await createCustomer({ documentType: "DNI", documentNumber, name: customerNames[i], address: `${300 + i * 12} San Martín`, phone: `381 455-${String(2210 + i).padStart(4, "0")}`, email: `cliente${i + 1}@correo.test`, currentAccount: i < 7, creditLimit: i === 0 ? null : 8000000 }, admin);
  customerIds.push(customer.id);
}

const [invoiceCount] = await db.select({ total: count() }).from(invoices);
if (invoiceCount.total < 50) {
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
console.log("Admin: laura@ferreteria.test / Admin123!");
console.log("Vendedor: pablo@ferreteria.test / Vendedor123!");
