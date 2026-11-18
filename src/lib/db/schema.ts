import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const createdAt = () => integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date());

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "vendedor"] }).notNull().default("vendedor"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
}, (table) => [uniqueIndex("users_email_unique").on(table.email)]);

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
}, (table) => [uniqueIndex("categories_name_unique").on(table.name)]);

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull(),
  description: text("description").notNull(),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  price: integer("price").notNull(),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
}, (table) => [uniqueIndex("products_code_unique").on(table.code), index("products_category_idx").on(table.categoryId)]);

export const stockMovements = sqliteTable("stock_movements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id),
  userId: integer("user_id").notNull().references(() => users.id),
  invoiceId: integer("invoice_id"),
  type: text("type", { enum: ["venta", "anulacion", "ingreso", "egreso"] }).notNull(),
  quantity: integer("quantity").notNull(),
  resultingStock: integer("resulting_stock").notNull(),
  reason: text("reason").notNull(),
  createdAt: createdAt(),
}, (table) => [index("stock_movements_product_idx").on(table.productId, table.createdAt)]);

export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  documentType: text("document_type", { enum: ["DNI", "CUIT"] }).notNull(),
  documentNumber: text("document_number").notNull(),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  currentAccount: integer("current_account", { mode: "boolean" }).notNull().default(false),
  creditLimit: integer("credit_limit"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
}, (table) => [uniqueIndex("customers_document_unique").on(table.documentType, table.documentNumber), index("customers_name_idx").on(table.name)]);

export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pointOfSale: integer("point_of_sale").notNull().default(1),
  number: integer("number").notNull(),
  customerId: integer("customer_id").references(() => customers.id),
  userId: integer("user_id").notNull().references(() => users.id),
  date: createdAt(),
  total: integer("total").notNull(),
  paymentForm: text("payment_form", { enum: ["contado", "tarjeta", "cuenta_corriente"] }).notNull(),
  amountReceived: integer("amount_received"),
  cardType: text("card_type"),
  cardBrand: text("card_brand"),
  cardLastFour: text("card_last_four"),
  status: text("status", { enum: ["emitida", "anulada"] }).notNull().default("emitida"),
  cancellationReason: text("cancellation_reason"),
  cancelledAt: integer("cancelled_at", { mode: "timestamp_ms" }),
  cancelledBy: integer("cancelled_by").references(() => users.id),
}, (table) => [uniqueIndex("invoices_number_unique").on(table.pointOfSale, table.number), index("invoices_date_idx").on(table.date)]);

export const invoiceItems = sqliteTable("invoice_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id),
  productId: integer("product_id").notNull().references(() => products.id),
  code: text("code").notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  subtotal: integer("subtotal").notNull(),
});

export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  receiptNumber: integer("receipt_number").notNull().unique(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  method: text("method", { enum: ["efectivo", "transferencia", "tarjeta_debito"] }).notNull(),
  note: text("note"),
  createdAt: createdAt(),
});

export const accountMovements = sqliteTable("account_movements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  invoiceId: integer("invoice_id").references(() => invoices.id),
  paymentId: integer("payment_id").references(() => payments.id),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type", { enum: ["debito", "credito"] }).notNull(),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  createdAt: createdAt(),
}, (table) => [index("account_movements_customer_idx").on(table.customerId, table.createdAt)]);

export const sequences = sqliteTable("sequences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind", { enum: ["factura", "recibo"] }).notNull(),
  value: integer("value").notNull().default(0),
}, (table) => [uniqueIndex("sequences_kind_unique").on(table.kind)]);
