# Share preview checklist (Sanadat branding)

Verify Sanadat logo and OG image appear after deploy — not the Vercel default icon.

**Production URL:** `https://www.sanadate.com` (or your `NEXT_PUBLIC_APP_URL`)

## Assets

| Asset | Path |
|-------|------|
| Favicon | `src/app/favicon.ico` → `/favicon.ico` |
| App icon | `src/app/icon.png` → `/icon.png` |
| Apple icon | `src/app/apple-icon.png` → `/apple-icon.png` |
| OG image | `public/og-image.png` → `/og-image.png` |
| Manifest | `public/site.webmanifest` |

## Metadata configuration

- Root: `src/app/layout.tsx`
- Locale (OG/Twitter/i18n): `src/app/[locale]/layout.tsx`
- Shared helpers: `src/lib/metadata/site-branding.ts`
- JSON-LD: `src/components/seo/organization-json-ld.tsx`

Regenerate PNG/ICO assets from `public/logo.png`:

```bash
npm run generate:brand-assets
```

## Before testing

1. Set `NEXT_PUBLIC_APP_URL` in Vercel (no trailing slash).
2. Redeploy production after metadata/asset changes.
3. Clear platform caches (links are cached aggressively).

## Platform checks

| Platform | How to test | Expected |
|----------|-------------|----------|
| **WhatsApp** | Send `https://www.sanadate.com/ar` in a chat | Sanadat OG image, title «سندات», Arabic description |
| **LinkedIn** | [Post Inspector](https://www.linkedin.com/post-inspector/) | `og-image.png` 1200×630, correct title |
| **X (Twitter)** | [Card Validator](https://cards-dev.twitter.com/validator) | `summary_large_image`, Sanadat preview |
| **Facebook** | [Sharing Debugger](https://developers.facebook.com/tools/debug/) | Scrape again after deploy; Sanadat image |
| **Telegram** | Paste link in any chat | Large preview with Sanadat branding |

## Browser / SEO

- [ ] Tab favicon shows Sanadat logo (not Vercel triangle).
- [ ] `https://www.sanadate.com/icon.png` returns Sanadat icon.
- [ ] `https://www.sanadate.com/og-image.png` returns 1200×630 image.
- [ ] View page source: `og:image`, `twitter:image`, `application/ld+json` Organization present.
- [ ] Google Search Console → URL inspection → live test (optional).

## If old Vercel icon still appears

1. Confirm latest deploy includes `src/app/favicon.ico` and `public/og-image.png`.
2. Use each platform’s debugger to **refresh/scrape** the URL.
3. Wait 24–48h for WhatsApp/Facebook cache expiry if debug tools are unavailable.
