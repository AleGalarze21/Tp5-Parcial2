export type FieldErrors = Record<string, string>;

export function issuesToFieldErrors(issues: readonly { path: PropertyKey[]; message: string }[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const field = issue.path.map(String).join(".");
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}

export function serverFieldErrors(payload: unknown): FieldErrors {
  if (!payload || typeof payload !== "object") return {};
  const details = (payload as { error?: { details?: unknown } }).error?.details;
  if (!Array.isArray(details)) return {};
  const errors: FieldErrors = {};
  for (const detail of details) {
    if (!detail || typeof detail !== "object") continue;
    const item = detail as { campo?: unknown; mensaje?: unknown };
    if (typeof item.campo === "string" && typeof item.mensaje === "string" && !errors[item.campo]) {
      errors[item.campo] = item.mensaje;
    }
  }
  return errors;
}

export function FieldError({ name, errors }: { name: string; errors: FieldErrors }) {
  const message = errors[name];
  if (!message) return null;
  return <small id={`${name.replaceAll(".", "-")}-error`} className="mt-1 block text-sm font-normal text-red-700">{message}</small>;
}
