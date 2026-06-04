import type { PlatformRole } from "@/lib/types";

export interface PlatformContext {
  userId: string;
  email: string;
  role: PlatformRole;
}

export type PlatformAccess = "staff" | "admin";
