import { randomBytes } from "node:crypto";
import { hash, compare } from "bcryptjs";
import { asc, eq } from "drizzle-orm";
import { ApiError } from "@/lib/api-error";
import { requireAdmin, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { passwordChangeSchema, userCreateSchema, userPatchSchema } from "@/lib/schemas";

export async function listUsers(params: { q?: string; active?: string } = {}) {
  await requireAdmin();
  const rows = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, active: users.active, createdAt: users.createdAt }).from(users).orderBy(asc(users.name));
  return rows.filter((user) => (!params.q || `${user.name} ${user.email}`.toLowerCase().includes(params.q.toLowerCase())) && (params.active === undefined || params.active === "todos" || String(user.active) === params.active));
}

export async function createUser(input: unknown) {
  await requireAdmin();
  const parsed = userCreateSchema.safeParse(input);
  if (!parsed.success) throw new ApiError(422, "VALIDACION", "Revisá nombre, email, rol y contraseña (mínimo 8 caracteres).", parsed.error.issues.map((issue) => ({ campo: String(issue.path[0] ?? "usuario"), mensaje: issue.message })));
  try {
    const [user] = await db.insert(users).values({ name: parsed.data.name, email: parsed.data.email, role: parsed.data.role, passwordHash: await hash(parsed.data.password, 10) }).returning({ id: users.id, name: users.name, email: users.email, role: users.role, active: users.active });
    return user;
  } catch (error) {
    if (String(error).toLowerCase().includes("unique")) throw new ApiError(409, "EMAIL_DUPLICADO", "Ya existe un usuario con ese email.");
    throw error;
  }
}

export async function updateUser(id: number, input: unknown) {
  const actor = await requireAdmin();
  const parsed = userPatchSchema.safeParse(input);
  if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) throw new ApiError(422, "VALIDACION", "Indicá al menos un dato para modificar.");
  if (id === actor.id && (parsed.data.active === false || parsed.data.role === "vendedor")) throw new ApiError(422, "OPERACION_SOBRE_SI_MISMO", "No podés desactivar tu usuario ni quitarte el rol de administrador.");
  try {
    const [user] = await db.update(users).set(parsed.data).where(eq(users.id, id)).returning({ id: users.id, name: users.name, email: users.email, role: users.role, active: users.active });
    if (!user) throw new ApiError(404, "NO_ENCONTRADO", "No encontramos ese usuario.");
    return user;
  } catch (error) {
    if (String(error).toLowerCase().includes("unique")) throw new ApiError(409, "EMAIL_DUPLICADO", "Ya existe un usuario con ese email.");
    throw error;
  }
}

export async function resetUserPassword(id: number) {
  await requireAdmin();
  const temporaryPassword = randomBytes(9).toString("base64url");
  const [user] = await db.update(users).set({ passwordHash: await hash(temporaryPassword, 10) }).where(eq(users.id, id)).returning({ id: users.id });
  if (!user) throw new ApiError(404, "NO_ENCONTRADO", "No encontramos ese usuario.");
  return { passwordTemporal: temporaryPassword };
}

export async function changePassword(input: unknown) {
  const actor = await requireUser();
  const parsed = passwordChangeSchema.safeParse(input);
  if (!parsed.success) throw new ApiError(422, "VALIDACION", "La contraseña nueva debe tener al menos 8 caracteres.");
  const [user] = await db.select().from(users).where(eq(users.id, actor.id)).limit(1);
  if (!user || !(await compare(parsed.data.actual, user.passwordHash))) throw new ApiError(422, "CONTRASENA_ACTUAL_INCORRECTA", "La contraseña actual no coincide.");
  await db.update(users).set({ passwordHash: await hash(parsed.data.nueva, 10) }).where(eq(users.id, actor.id));
}
