import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireTenantContext } from "@/lib/auth/require-tenant";
import type { DocumentActivityAction } from "@/application/documents";
import { ActivityLogRepository } from "@/infrastructure/supabase/repositories";

type Body = {
  action?: DocumentActivityAction;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    if (!body.action || !body.entityId) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: "action and entityId are required" } },
        { status: 400 }
      );
    }

    const ctx = await requireTenantContext();
    const supabase = await createClient();
    const repo = new ActivityLogRepository(supabase);
    await repo.log(ctx, body.action, body.entityId, body.metadata ?? {});
    return NextResponse.json({ ok: true });
  } catch {
    // Logging must fail gracefully and never break primary UX flow.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
