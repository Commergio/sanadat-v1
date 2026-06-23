# Supabase email templates

Configure in **Supabase Dashboard → Authentication → Email Templates**.

Use your production domain in all links. Callback always goes through `/auth/callback` (no locale prefix).

**Site URL:** `https://your-domain.com`  
**Redirect allow list:** `https://your-domain.com/auth/callback`

Built by app: `buildAuthCallbackUrl()` →  
`https://your-domain.com/auth/callback?next=%2Far%2Fdashboard`

---

## Confirm signup

**When:** User registers with email confirmation enabled.

**Subject (EN):** Confirm your Sanadat account  
**Subject (AR):** تأكيد حسابك في سندات

**Body tips:**
- Explain they registered on Sanadat
- CTA button: “Confirm email” → `{{ .ConfirmationURL }}`
- Supabase appends redirect to Site URL / callback — ensure `emailRedirectTo` from app matches allow list

**App behavior after confirm:**
- Session created → redirect to `/ar/dashboard` (or locale in `next`)
- No session → redirect to login with `?message=email-confirmed-login-required`

**User-facing messages (already in app):**
- Register success: “Confirmation link sent to your email”
- Login after confirm: “Email confirmed — sign in to continue”

---

## Invite user

**When:** Supabase invite or team invite (if using Supabase invite emails).

**Subject:** You've been invited to Sanadat

Use `{{ .ConfirmationURL }}` for accept link.

Team invites in Sanadat use `/invite/[token]` — separate from Supabase auth invite.

---

## Magic link

**When:** Passwordless login (if enabled).

Redirect via `/auth/callback` same as confirmation.

---

## Change email address

**When:** User changes email in account settings.

Confirm both old and new per Supabase settings.

---

## Reset password

**When:** User submits forgot password form (`/forgot-password`).

**Subject (EN):** Reset your Sanadat password  
**Subject (AR):** إعادة تعيين كلمة مرور سندات

**App:** `resetPasswordForEmail` should use `redirectTo: buildAuthCallbackUrl('/{locale}/dashboard', locale)` or login page.

**User-facing messages:**
- “Password reset link sent”
- “Check your email (and spam folder)”

---

## Email OTP (if enabled)

Short code template — rarely used if magic link preferred.

---

## SMTP / deliverability

| Setting | Recommendation |
|---------|----------------|
| Production | Custom SMTP (Resend, SendGrid, AWS SES) or Supabase Pro custom SMTP |
| From address | `noreply@sanadat.sa` or verified domain |
| SPF/DKIM | Configure on sending domain |
| Rate limits | Supabase free tier has limits — monitor `over_email_send_rate_limit` error in app |

---

## Arabic RTL emails

Supabase templates support HTML. For Arabic:

```html
<div dir="rtl" style="font-family: Tahoma, Arial, sans-serif;">
  <p>مرحباً،</p>
  <p>اضغط الزر أدناه لتأكيد بريدك الإلكتروني في سندات.</p>
  <p><a href="{{ .ConfirmationURL }}">تأكيد البريد</a></p>
</div>
```

Send bilingual emails (AR block + EN block) if user locale is unknown at send time.

---

## Testing without production inbox

1. Supabase local: Inbucket at `http://localhost:54324`
2. Staging project: use `+alias` Gmail trick
3. Disable confirm email in dev only — **never in production**

---

## Checklist before launch

| ☐ | Item |
|---|------|
| ☐ | Site URL = production domain |
| ☐ | `/auth/callback` in redirect allow list |
| ☐ | Confirm signup template branded (logo, Sanadat name) |
| ☐ | Reset password template tested end-to-end |
| ☐ | Links open on mobile (customers use phones) |
| ☐ | Spam score checked (mail-tester.com) |
| ☐ | `email_not_confirmed` error shows friendly Arabic/English in login form |

---

## Related

- [Production env checklist](./production-env-checklist.md)
- Auth callback: `src/app/auth/callback/page.tsx`
- Register: `src/components/auth/register-form.tsx`
