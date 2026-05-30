import { IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, isRtlLocale, type Locale } from "@/i18n/routing";
import { ThemeProvider } from "@wrksz/themes/next";
import { Providers } from "@/components/providers";
import "../globals.css";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans-en",
  display: "swap",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      locale: locale === "ar" ? "ar_SA" : "en_US",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();
  const dir = isRtlLocale(locale) ? "rtl" : "ltr";
  const fontClass =
    locale === "ar"
      ? ibmPlexArabic.variable
      : `${inter.variable} ${ibmPlexArabic.variable}`;

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body
        className={`${fontClass} min-h-screen bg-background font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
          storage="cookie"
        >
          <NextIntlClientProvider locale={locale} messages={messages}>
            <Providers locale={locale}>{children}</Providers>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
