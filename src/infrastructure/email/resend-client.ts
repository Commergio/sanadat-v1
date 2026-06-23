import { getResendApiKey } from "@/lib/env";
import { SUPPORT_EMAIL } from "@/lib/constants";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  skipped?: boolean;
  error?: string;
}

const DEFAULT_FROM = `Sanadat | سندات <${SUPPORT_EMAIL}>`;

export async function sendTransactionalEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.info("[email] RESEND_API_KEY not set — skipped:", input.subject, "→", input.to);
    }
    return { ok: true, skipped: true };
  }

  const to = input.to.trim().toLowerCase();
  if (!to) {
    return { ok: false, error: "Missing recipient" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: DEFAULT_FROM,
        to: [to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.replyTo ?? SUPPORT_EMAIL,
      }),
    });

    const payload = (await res.json().catch(() => ({}))) as { id?: string; message?: string };

    if (!res.ok) {
      return {
        ok: false,
        error: payload.message ?? `Resend HTTP ${res.status}`,
      };
    }

    return { ok: true, id: payload.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}
