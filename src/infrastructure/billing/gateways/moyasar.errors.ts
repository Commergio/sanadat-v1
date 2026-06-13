export class MoyasarGatewayError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
    readonly details?: unknown
  ) {
    super(message);
    this.name = "MoyasarGatewayError";
  }
}

type MoyasarErrorPayload = {
  message?: string;
  type?: string;
  errors?: Record<string, string[] | string>;
};

/** Format Moyasar API validation errors without exposing secrets. */
export function formatMoyasarErrorMessage(
  payload: unknown,
  fallback = "Moyasar invoice creation failed"
): string {
  if (!payload || typeof payload !== "object") return fallback;

  const body = payload as MoyasarErrorPayload;
  const base =
    typeof body.message === "string" && body.message.trim()
      ? body.message.trim()
      : fallback;

  if (!body.errors || typeof body.errors !== "object") return base;

  const parts: string[] = [];
  for (const [field, value] of Object.entries(body.errors)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        parts.push(`${field}: ${String(item)}`);
      }
    } else if (value != null) {
      parts.push(`${field}: ${String(value)}`);
    }
  }

  return parts.length > 0 ? `${base} (${parts.join("; ")})` : base;
}

/** Safe subset of Moyasar error payload for API responses (no secrets). */
export function extractMoyasarValidationDetails(
  payload: unknown
): { type?: string; errors?: Record<string, string[] | string> } | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const body = payload as MoyasarErrorPayload;
  if (!body.errors && !body.type) return undefined;
  return {
    type: body.type,
    errors: body.errors,
  };
}
