export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function readJson<T = unknown>(request: Request): Promise<T> {
  try { return await request.json() as T; }
  catch { throw new ApiError(400, "JSON_INVALIDO", "El cuerpo de la solicitud no es JSON válido."); }
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json({ error: { code: error.code, message: error.message, details: error.details } }, { status: error.status });
  }
  console.error(error);
  return Response.json({ error: { code: "ERROR_INTERNO", message: "Ocurrió un error inesperado." } }, { status: 500 });
}
