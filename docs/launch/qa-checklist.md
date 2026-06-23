# Launch QA checklist

Manual regression before production launch. Check **Arabic (`/ar`)** and **English (`/en`)** where UI is user-facing.

Legend: ☐ not tested · ✅ pass · ❌ fail (note in ticket)

---

## 1. Public & marketing

| # | Test | AR | EN |
|---|------|----|----|
| 1.1 | Landing page loads (hero, features, pricing, FAQ, CTA) | ☐ | ☐ |
| 1.2 | Pricing section shows 399 SAR/year | ☐ | ☐ |
| 1.3 | FAQ accordion works | ☐ | ☐ |
| 1.4 | `/contact` — email, phone, hours | ☐ | ☐ |
| 1.5 | `/privacy` — full policy readable | ☐ | ☐ |
| 1.6 | `/terms` — full terms readable | ☐ | ☐ |
| 1.7 | Footer legal links go to real pages (not `#`) | ☐ | ☐ |
| 1.8 | Locale switcher AR ↔ EN | ☐ | ☐ |
| 1.9 | Dark/light theme on marketing pages | ☐ | ☐ |

---

## 2. Auth & email

| # | Test | Notes |
|---|------|-------|
| 2.1 | Register new company account | |
| 2.2 | Email confirmation link → `/auth/callback` → dashboard or login prompt | |
| 2.3 | Login with confirmed account | |
| 2.4 | Login blocked when email not confirmed (clear error) | |
| 2.5 | Forgot password → email → reset works | |
| 2.6 | Register form links to Terms + Privacy | |
| 2.7 | Logout | |
| 2.8 | Session expiry → friendly re-login message | |
| 2.9 | Supabase email templates match [supabase-email-templates.md](./supabase-email-templates.md) | |

---

## 3. Customers

| # | Test |
|---|------|
| 3.1 | Add customer (name + phone) |
| 3.2 | Search customers |
| 3.3 | Send verification link (WhatsApp opens) |
| 3.4 | Customer opens link → signs → verified badge |
| 3.5 | Signature preview on customer profile |
| 3.6 | Cannot send verification to already-verified customer |

---

## 4. Receipt vouchers

| # | Test |
|---|------|
| 4.1 | Create draft (customer required) — no official number |
| 4.2 | PDF / Print / final WhatsApp **disabled** on draft |
| 4.3 | Watermark “awaiting customer approval” when pending |
| 4.4 | Send approval link |
| 4.5 | Customer approves + signs on public page |
| 4.6 | Status → issued, official number assigned |
| 4.7 | Signature on detail, A4 preview, PDF, print |
| 4.8 | Resend approval while pending |
| 4.9 | Customer rejects → reason shown, export disabled |
| 4.10 | Cancel draft / pending / issued |

---

## 5. Payment vouchers

Same as §4 for payment vouchers (`/dashboard/payments`).

| # | Test |
|---|------|
| 5.1–5.10 | Mirror receipt flow |

---

## 6. Invoices

| # | Test |
|---|------|
| 6.1 | Create draft with customer + line items |
| 6.2 | Export disabled until issued |
| 6.3 | Public approval shows items table + subtotal/discount/total |
| 6.4 | Approve → issued + signature + export enabled |
| 6.5 | Reject + cancel flows |

---

## 6b. Trial document limit (5 total)

| # | Test | Expected |
|---|------|----------|
| 6b.1 | Trialing company creates receipt #1–#5 | Success |
| 6b.2 | Trialing company creates 6th document (any type) | Blocked — `TRIAL_LIMIT_REACHED` |
| 6b.3 | Limit counts receipts + payments + invoices combined | Yes |
| 6b.4 | Cancelled / rejected / draft documents still count | Yes |
| 6b.5 | Active subscription — no limit | Unlimited creates |
| 6b.6 | Expired / suspended / cancelled subscription | Create blocked |
| 6b.7 | Viewer role cannot create (unchanged) | `FORBIDDEN` |
| 6b.8 | Dashboard shows trial usage widget when trialing | Remaining count |
| 6b.9 | Create pages disable save at limit + CTA to subscription | Yes |
| 6b.10 | Platform admin company detail shows trial usage | When `trialing` |

---

## 7. Approval & security (public)

| # | Test | Expected |
|---|------|----------|
| 7.1 | Invalid token | “Invalid link” |
| 7.2 | Expired token | “Link expired” |
| 7.3 | Used token after approve | “Approved” screen |
| 7.4 | Used token after reject | “Rejected” screen (not Approved) |
| 7.5 | Cancelled document link | “Document cancelled” |
| 7.6 | No raw storage paths in API JSON | Signed URLs only |
| 7.7 | Cross-tenant: user A cannot open user B doc by ID | 404/403 |

---

## 8. PDF & print

| # | Test |
|---|------|
| 8.1 | Print issued receipt — browser print dialog |
| 8.2 | Export PDF — file downloads |
| 8.3 | Customer signature visible on PDF |
| 8.4 | Draft/pending — export blocked with toast |
| 8.5 | Legacy issued docs (pre-P3) still export |

---

## 9. Billing (Moyasar)

| # | Test |
|---|------|
| 9.1 | Subscription page shows plan + price |
| 9.2 | Checkout redirects to Moyasar |
| 9.3 | Successful payment → return URL → active subscription |
| 9.4 | Webhook `payment_paid` activates subscription (check DB/logs) |
| 9.5 | Failed payment handled gracefully |
| 9.6 | Apply valid coupon at checkout |
| 9.7 | Invalid/expired coupon rejected |

---

## 9b. Invitation promo codes

| # | Test | Expected |
|---|------|----------|
| 9b.1 | Platform admin creates invitation code (90 days) | Listed in `/admin/invitation-codes` |
| 9b.2 | Platform support can view codes | Read-only, no create/edit/delete |
| 9b.3 | Tenant owner applies valid code on subscription page | `active`, `subscription_source = promo`, no payment row |
| 9b.4 | Success message shows expiry date | AR + EN |
| 9b.5 | Same company applies same code again (per_company_limit=1) | Clear error |
| 9b.6 | Expired or inactive code rejected | Clear error |
| 9b.7 | Register with optional invitation code → subscription page prefill | Code in field + hint message |
| 9b.8 | Promo active — no 5-document trial limit | Unlimited creates |
| 9b.9 | Platform company detail shows `subscription_source` + redemptions | When promo used |
| 9b.10 | Deactivated code cannot be redeemed | Validation error |

---

## 10. Team & settings

| # | Test |
|---|------|
| 10.1 | Company settings — name, CR, VAT, logo |
| 10.2 | Invite team member → accept invite |
| 10.3 | Role restrictions (viewer cannot cancel docs) |

---

## 11. Admin dashboard (`/admin`)

Requires `profiles.platform_role = platform_admin` or `platform_support`.

| # | Test | Admin | Support |
|---|------|-------|---------|
| 11.1 | Dashboard KPIs load | ☐ | ☐ |
| 11.2 | Companies list + detail | ☐ | ☐ |
| 11.3 | Suspend / reactivate company | ☐ | read-only |
| 11.4 | Extend subscription | ☐ | read-only |
| 11.5 | Coupons CRUD | ☐ | read-only |
| 11.6 | Publish announcement | ☐ | read-only |
| 11.7 | Support tickets — reply, close | ☐ | ☐ |
| 11.8 | Platform staff management | ☐ | N/A |

---

## 12. Announcements & support (tenant)

| # | Test |
|---|------|
| 12.1 | Tenant sees published announcement |
| 12.2 | Create support ticket |
| 12.3 | Reply on ticket thread |
| 12.4 | Closed ticket shows hint |

---

## 13. Activity logs

Verify entries appear for:

- `document.draft_created`
- `document.approval_sent`
- `document.approved`
- `document.rejected`
- `document.issued`
- `document.cancelled`
- `customer.verified`

---

## 14. Build & deploy

| # | Test |
|---|------|
| 14.1 | `npm run build` — zero errors |
| 14.2 | Vercel production deploy success |
| 14.3 | All env vars set per [production-env-checklist.md](./production-env-checklist.md) |

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product | | | |
| Engineering | | | |
| QA | | | |
