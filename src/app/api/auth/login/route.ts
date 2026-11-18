import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createSession } from "@/lib/auth";
import { ApiError, errorResponse } from "@/lib/api-error";

const loginSchema = z.object({ email: z.email(), password: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const input = loginSchema.safeParse(await request.json());
    if (!input.success) throw new ApiError(422, "VALIDACION", "Ingresá un email y una contraseña válidos.");
    const [user] = await db.select().from(users).where(eq(users.email, input.data.email.toLowerCase())).limit(1);
    const valid = user ? await compare(input.data.password, user.passwordHash) : false;
    if (!user || !user.active || !valid) throw new ApiError(401, "CREDENCIALES_INVALIDAS", "El email o la contraseña no son correctos.");
    await createSession(user.id);
    return Response.json({ id: user.id, nombre: user.name, email: user.email, rol: user.role });
  } catch (error) { return errorResponse(error); }
}
