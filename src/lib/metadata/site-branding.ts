import type { Metadata } from "next";

/** Canonical site URL for metadata, OG, and JSON-LD (no trailing slash). */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  return fromEnv || "https://www.sanadate.com";
}

export const SITE_NAME_AR = "سندات";
export const SITE_DESCRIPTION_AR =
  "منصة سعودية لإدارة سندات القبض والصرف والفواتير غير الضريبية";

export const OG_IMAGE_PATH = "/og-image.png";
export const ICON_PATH = "/icon.png";
export const APPLE_ICON_PATH = "/apple-icon.png";

export const THEME_COLOR = "#4F46E5";
export const BACKGROUND_COLOR = "#ffffff";

type SiteMetadataInput = {
  title?: string;
  description?: string;
  locale?: "ar" | "en";
};

export function buildSiteMetadata(input: SiteMetadataInput = {}): Metadata {
  const siteUrl = getSiteUrl();
  const title = input.title ?? SITE_NAME_AR;
  const description = input.description ?? SITE_DESCRIPTION_AR;
  const ogLocale = input.locale === "en" ? "en_US" : "ar_SA";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | ${SITE_NAME_AR}`,
    },
    description,
    applicationName: SITE_NAME_AR,
    manifest: "/site.webmanifest",
    icons: {
      icon: [{ url: ICON_PATH, type: "image/png" }],
      apple: [{ url: APPLE_ICON_PATH, type: "image/png" }],
      shortcut: ICON_PATH,
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME_AR,
      title,
      description,
      url: siteUrl,
      locale: ogLocale,
      images: [
        {
          url: OG_IMAGE_PATH,
          width: 1200,
          height: 630,
          alt: "Sanadat",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE_PATH],
    },
    alternates: {
      canonical: siteUrl,
    },
  };
}

export function buildOrganizationJsonLd() {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME_AR,
    url: siteUrl,
    logo: `${siteUrl}${ICON_PATH}`,
  };
}
