import { cookies } from "next/headers";
import { ACTIVE_COMPANY_COOKIE, ACTIVE_COMPANY_COOKIE_MAX_AGE } from "./constants";

export async function getActiveCompanyIdFromCookies(): Promise<string | null> {
  const store = await cookies();
  return store.get(ACTIVE_COMPANY_COOKIE)?.value ?? null;
}

export function activeCompanyCookieOptions(companyId: string) {
  return {
    name: ACTIVE_COMPANY_COOKIE,
    value: companyId,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: ACTIVE_COMPANY_COOKIE_MAX_AGE,
  };
}
