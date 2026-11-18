function normalizeAliases(input: unknown, aliases: Record<string, string>) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return input;
  const normalized: Record<string, unknown> = { ...input };
  for (const [publicName, internalName] of Object.entries(aliases)) {
    if (publicName in normalized) {
      if (!(internalName in normalized)) normalized[internalName] = normalized[publicName];
      delete normalized[publicName];
    }
  }
  return normalized;
}

export const normalizeProduct = (input: unknown) => normalizeAliases(input, { codigo: "code", descripcion: "description", categoriaId: "categoryId", precio: "price", stockMinimo: "minStock", stockInicial: "initialStock", activo: "active" });
export const normalizeCustomer = (input: unknown) => normalizeAliases(input, { tipoDoc: "documentType", nroDoc: "documentNumber", nombre: "name", domicilio: "address", telefono: "phone", cuentaCorriente: "currentAccount", limiteCredito: "creditLimit", activo: "active" });
export const normalizeCategory = (input: unknown) => normalizeAliases(input, { nombre: "name", activa: "active" });
export const normalizeUser = (input: unknown) => normalizeAliases(input, { nombre: "name", rol: "role", activo: "active" });
export const normalizePayment = (input: unknown) => normalizeAliases(input, { importe: "amount", medio: "method", observacion: "note" });
export const normalizeStockMovement = (input: unknown) => normalizeAliases(input, { tipo: "type", cantidad: "quantity", motivo: "reason", observacion: "note" });

export function publicProduct<T extends { id: number; code: string; description: string; categoryId: number; category?: string; price: number; stock: number; minStock: number; belowMinimum?: boolean; active: boolean }>(product: T) {
  return { ...product, codigo: product.code, descripcion: product.description, categoria: product.category ? { id: product.categoryId, nombre: product.category } : { id: product.categoryId }, precio: product.price, existencia: product.stock, stockMinimo: product.minStock, bajoMinimo: product.belowMinimum ?? product.stock <= product.minStock, activo: product.active };
}

export function publicCustomer<T extends { id: number; documentType: string; documentNumber: string; name: string; address?: string | null; phone?: string | null; email?: string | null; currentAccount?: boolean; creditLimit?: number | null; balance?: number; active?: boolean }>(customer: T) {
  return { ...customer, tipoDoc: customer.documentType, nroDoc: customer.documentNumber, nombre: customer.name, domicilio: customer.address ?? null, telefono: customer.phone ?? null, cuentaCorriente: customer.currentAccount, limiteCredito: customer.creditLimit, saldo: customer.balance, activo: customer.active };
}
