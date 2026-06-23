import { getTranslations } from "next-intl/server";
import { StaticPageShell } from "@/components/marketing/static-page-shell";

const SECTIONS = [
  "intro",
  "service",
  "accounts",
  "documents",
  "billing",
  "acceptableUse",
  "liability",
  "changes",
  "contact",
] as const;

export default async function TermsPage() {
  const t = await getTranslations("staticPages.terms");

  return (
    <StaticPageShell title={t("title")} updated={t("updated")}>
      {SECTIONS.map((key) => (
        <section key={key} className="space-y-2">
          <h2 className="text-xl font-semibold">{t(`sections.${key}.title`)}</h2>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
            {t(`sections.${key}.body`)}
          </p>
        </section>
      ))}
    </StaticPageShell>
  );
}
