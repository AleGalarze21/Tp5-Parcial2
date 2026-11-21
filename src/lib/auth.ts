import { and, eq } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { ApiError } from "@/lib/api-error";

const COOKIE_NAME = "nexusgpu_session";
const SESSION_TTL = 60 * 60 * 24 * 7;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value && process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET no está configurado.");
  return new TextEncoder().encode(value || "dev-only-change-this-session-secret-32");
}

export async function createSession(userId: number) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL}s`)
    .sign(secret());
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_TTL });
}

export async function clearSession() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
}

export async function getCurrentUser() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const id = Number(payload.sub);
    if (!Number.isInteger(id)) return null;
    const [user] = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, active: users.active }).from(users).where(and(eq(users.id, id), eq(users.active, true))).limit(1);
    return user ?? null;
  } catch {
    return null;
  }
}

export type AuthenticatedUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function requireUser(asUser?: AuthenticatedUser) {
  if (asUser?.active) return asUser;
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "NO_AUTENTICADO", "Iniciá sesión para continuar.");
  return user;
}

export async function requireAdmin(asUser?: AuthenticatedUser) {
  const user = await requireUser(asUser);
  if (user.role !== "admin") throw new ApiError(403, "SIN_PERMISO", "No tenés permiso para realizar esta acción.");
  return user;
}
