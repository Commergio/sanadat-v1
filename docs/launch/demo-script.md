# Sanadat launch demo script

**Duration:** ~25–30 minutes  
**Audience:** Investors, partners, or pilot customers  
**Languages:** Run once in Arabic (`/ar`), optionally repeat key screens in English (`/en`)

**Prerequisites:**
- Production or staging URL with env vars configured
- Platform admin account
- Second browser/device for “customer” (approval + verification links)
- Moyasar sandbox card (test mode)

---

## 1. Landing & positioning (3 min)

1. Open `/{locale}` — Sanadat landing page
2. Scroll **Features** — digitize receipts, payments, invoices
3. **How it works** — create → approve → issue → share
4. **Pricing** — 399 SAR/year, single plan
5. **FAQ** — compliance-ready positioning
6. Footer → **Privacy** and **Terms** (legal pages live)
7. **Contact** — support channels

**Talking point:** Saudi-first, A4 documents, customer approval with signature, WhatsApp-friendly.

---

## 2. Register & login (3 min)

1. Click **Create account** → `/register`
2. Fill company name, email, phone, password
3. Show Terms + Privacy links on form
4. Submit → toast “confirmation email sent” (or auto-login if confirm disabled in dev)
5. Confirm email via inbox → lands on dashboard or login prompt
6. **Login** → dashboard overview

**Fallback line:** “If email doesn’t arrive, check spam; link expires per Supabase settings.”

---

## 3. Company setup (2 min)

1. **Settings → Company** — logo, CR, VAT, address
2. Brief mention: branding appears on all A4 documents

---

## 4. Customer + signature verification (4 min)

1. **Dashboard → Customers → Add customer**
2. Name + Saudi mobile number
3. Open customer profile → **Send signature link**
4. On phone: open WhatsApp link → customer verification page
5. Customer draws signature → **Approve**
6. Back on dashboard: **Verified** badge + signature preview

**Talking point:** Signature reused on future document approvals.

---

## 5. Receipt voucher — full approval flow (6 min)

1. **New receipt voucher** (Voucher Studio)
2. Select verified customer, amount, payment method
3. Save → **draft** (no official number yet)
4. Show detail page:
   - PDF / Print / final WhatsApp **disabled**
   - “Send to customer for approval” panel
5. Click **Send approval** → WhatsApp opens with link
6. On phone: public approve page — review amount, sign, **Approve**
7. Back on desktop: refresh → **Issued**, official number, signature block
8. **Export PDF** + **Print** — show signature on A4

**Optional:** Show **Reject** flow on a second draft (reason displayed, export stays off).

---

## 6. Payment voucher (2 min)

Repeat steps 5.1–5.8 briefly — “same approval architecture for outgoing payments.”

---

## 7. Invoice (2 min)

1. **New invoice** — customer + line items + discount
2. Send approval → show **items table** on public page
3. Approve → issued with number + export

---

## 8. Subscription & coupon (4 min)

1. **Dashboard → Subscription**
2. Show plan price 399 SAR/year
3. Enter demo coupon code (create in admin beforehand)
4. **Checkout** → Moyasar sandbox payment page
5. Pay with test card → return to app
6. Subscription shows **Active** (webhook may take a few seconds)

**Talking point:** Webhook at `/api/billing/webhook/moyasar` activates subscription server-side.

---

## 9. Admin dashboard (3 min)

*Switch to platform admin account.*

1. `/admin` — KPIs: companies, subscriptions, revenue
2. **Clients** — find demo company
3. **Subscriptions** — show active row (demo extend if asked)
4. **Coupons** — show code used in checkout
5. **Announcements** — publish “Welcome to Sanadat” banner
6. Refresh tenant dashboard — announcement visible

---

## 10. Support ticket (2 min)

**Tenant browser:**
1. Dashboard → Support → New ticket
2. Subject + description → submit

**Admin browser:**
1. Admin → Support → open ticket
2. Reply → tenant sees response

---

## 11. Close (1 min)

Recap:
- End-to-end document lifecycle with legal customer signature
- Subscription billing with coupons
- Platform ops: companies, support, announcements

**CTA:** Register at sanadat.sa — 399 SAR/year.

---

## Demo data cheat sheet

| Item | Suggested value |
|------|-----------------|
| Company | منشأة النخيل / Al Nakheel Trading |
| Customer | أحمد العتيبي / +966501234567 |
| Receipt amount | 1,500 SAR |
| Coupon | `LAUNCH10` (10% off — create in admin) |
| Moyasar test card | Use Moyasar sandbox docs |

---

## Troubleshooting during demo

| Problem | Quick fix |
|---------|-----------|
| Approval link shows invalid | Resend from dashboard; check token not expired |
| PDF disabled | Document must be **issued** after customer approval |
| Subscription not active | Check Moyasar webhook secret + Vercel logs |
| Admin 403 | `profiles.platform_role` must be set |

---

## Related docs

- [QA checklist](./qa-checklist.md)
- [Admin operations guide](./admin-operations-guide.md)
