import { SUPPORT_EMAIL, SUPPORT_PHONE_DISPLAY } from "@/lib/constants";
import { getAppUrl } from "@/lib/env";

export interface AccountActivatedEmailContent {
  recipientName?: string | null;
  companyName?: string | null;
  expiresAt?: string | null;
  dashboardUrl?: string;
}

function formatExpiryDate(iso: string): string {
  try {
    const date = new Date(iso);
    return new Intl.DateTimeFormat("ar-SA", {
      dateStyle: "long",
      timeZone: "Asia/Riyadh",
    }).format(date);
  } catch {
    return iso;
  }
}

function formatExpiryDateEn(iso: string): string {
  try {
    const date = new Date(iso);
    return new Intl.DateTimeFormat("en-SA", {
      dateStyle: "long",
      timeZone: "Asia/Riyadh",
    }).format(date);
  } catch {
    return iso;
  }
}

export function buildAccountActivatedEmail(content: AccountActivatedEmailContent) {
  const name = content.recipientName?.trim() || "عزيزي العميل";
  const nameEn = content.recipientName?.trim() || "there";
  const company = content.companyName?.trim();
  const dashboardUrl = content.dashboardUrl ?? `${getAppUrl()}/ar/dashboard`;
  const hasSubscription = Boolean(content.expiresAt);
  const expiryAr = content.expiresAt ? formatExpiryDate(content.expiresAt) : null;
  const expiryEn = content.expiresAt ? formatExpiryDateEn(content.expiresAt) : null;

  const subject = hasSubscription
    ? "تم تفعيل اشتراكك في سندات | Your Sanadat subscription is active"
    : "تم تفعيل حسابك في سندات | Your Sanadat account is active";

  const subscriptionBlockAr = hasSubscription
    ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;">
        تم تفعيل اشتراكك بنجاح لمدة <strong>سنة واحدة</strong>.
        يمكنك الآن إصدار سندات القبض والصرف والفواتير دون قيود.
      </p>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#475569;">
        تاريخ انتهاء الاشتراك: <strong style="color:#0f172a;">${expiryAr}</strong>
      </p>`
    : `<p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#334155;">
        تم تفعيل حسابك بنجاح. يمكنك الآن تسجيل الدخول والبدء في استخدام المنصة.
      </p>`;

  const subscriptionBlockEn = hasSubscription
    ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;">
        Your subscription is now active for <strong>one year</strong>.
        You can create receipt vouchers, payment vouchers, and invoices without limits.
      </p>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#475569;">
        Subscription expires on: <strong style="color:#0f172a;">${expiryEn}</strong>
      </p>`
    : `<p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#334155;">
        Your account is now active. Sign in and start using the platform.
      </p>`;

  const companyLineAr = company
    ? `<p style="margin:0 0 12px;font-size:14px;color:#64748b;">المنشأة: <strong style="color:#0f172a;">${company}</strong></p>`
    : "";
  const companyLineEn = company
    ? `<p style="margin:0 0 12px;font-size:14px;color:#64748b;">Company: <strong style="color:#0f172a;">${company}</strong></p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Tahoma,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:28px 32px;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">سندات</p>
              <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.9);">Sanadat — Commergio</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;" dir="rtl">
              <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0f172a;">مرحباً ${name}،</p>
              <p style="margin:0 0 20px;font-size:16px;font-weight:600;color:#4f46e5;">تم تفعيل حسابك بنجاح ✓</p>
              ${companyLineAr}
              ${subscriptionBlockAr}
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
                <tr>
                  <td style="border-radius:10px;background:#4f46e5;">
                    <a href="${dashboardUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">
                      الانتقال إلى لوحة التحكم
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;line-height:1.7;color:#64748b;">
                للدعم: <a href="mailto:${SUPPORT_EMAIL}" style="color:#4f46e5;">${SUPPORT_EMAIL}</a>
                · واتساب ${SUPPORT_PHONE_DISPLAY}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;border-top:1px solid #e2e8f0;" dir="ltr">
              <p style="margin:24px 0 8px;font-size:16px;font-weight:600;color:#0f172a;">Hello ${nameEn},</p>
              <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#4f46e5;">Your account has been activated</p>
              ${companyLineEn}
              ${subscriptionBlockEn}
              <p style="margin:0;font-size:13px;line-height:1.7;color:#64748b;">
                Support: <a href="mailto:${SUPPORT_EMAIL}" style="color:#4f46e5;">${SUPPORT_EMAIL}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;text-align:center;">
                © Commergio · ${SUPPORT_EMAIL}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = hasSubscription
    ? `مرحباً ${name},\n\nتم تفعيل اشتراكك في سندات لمدة سنة واحدة.\nتاريخ الانتهاء: ${expiryAr}\n\nلوحة التحكم: ${dashboardUrl}\n\nالدعم: ${SUPPORT_EMAIL}`
    : `مرحباً ${name},\n\nتم تفعيل حسابك في سندات بنجاح.\n\nلوحة التحكم: ${dashboardUrl}\n\nالدعم: ${SUPPORT_EMAIL}`;

  return { subject, html, text };
}
