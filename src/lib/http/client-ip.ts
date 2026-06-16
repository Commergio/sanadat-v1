import { isIP } from "node:net";

/**
 * Normalize a raw header/value to a Postgres-compatible INET string, or null.
 * Never throws — invalid values return null so approval flows are not blocked.
 */
export function parseInetIp(raw: string | null | undefined): string | null {
  if (raw == null) return null;

  let value = raw.trim();
  if (!value || value.toLowerCase() === "unknown") return null;

  if (value.toLowerCase() === "localhost") {
    return "127.0.0.1";
  }

  // Bracketed IPv6 e.g. [::1]:443
  if (value.startsWith("[")) {
    const end = value.indexOf("]");
    if (end > 1) {
      value = value.slice(1, end);
    }
  } else if (value.includes(".") && value.includes(":")) {
    // IPv4 with port e.g. 203.0.113.1:8080
    const lastColon = value.lastIndexOf(":");
    const portPart = value.slice(lastColon + 1);
    if (/^\d+$/.test(portPart)) {
      value = value.slice(0, lastColon);
    }
  }

  value = value.trim();
  if (!value) return null;

  if (isIP(value) === 0) return null;
  return value;
}

/**
 * Best-effort client IP from common proxy headers.
 * Checks cf-connecting-ip, x-real-ip, then x-forwarded-for (first valid entry).
 */
export function getClientIp(request: Request): string | null {
  const headerValues = [
    request.headers.get("cf-connecting-ip"),
    request.headers.get("x-real-ip"),
    request.headers.get("x-forwarded-for"),
  ];

  for (const header of headerValues) {
    if (!header) continue;

    const parts = header
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    for (const part of parts) {
      const parsed = parseInetIp(part);
      if (parsed) return parsed;
    }
  }

  return null;
}
