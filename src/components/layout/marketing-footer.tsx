import { getTranslations } from "next-intl/server";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/logo";
import { Link } from "@/i18n/navigation";
export async function MarketingFooter() {
  const t = await getTranslations("footer");
  const tApp = await getTranslations("app");
  const tNav = await getTranslations("nav");

  const productLinks = [
    { href: "#features", label: tNav("features") },
    { href: "#how-it-works", label: t("howItWorks") },
    { href: "#showcase", label: t("showcase") },
    { href: "#pricing", label: tNav("pricing") },
    { href: "#faq", label: tNav("faq") },
  ];

  const companyLinks = [
    { href: "#features", label: t("aboutUs") },
    { href: "/login", label: tNav("login"), isLink: true },
    { href: "/register", label: tNav("register"), isLink: true },
  ];

  const legalLinks = [
    { href: "#faq", label: t("privacy") },
    { href: "#pricing", label: t("terms") },
  ];

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Logo />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {t("about")}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">{tApp("madeIn")}</p>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-3">
            <div>
              <h4 className="mb-4 text-sm font-semibold text-foreground">{t("product")}</h4>
              <ul className="space-y-3">
                {productLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-semibold text-foreground">{t("company")}</h4>
              <ul className="space-y-3">
                {companyLinks.map((link) => (
                  <li key={link.label}>
                    {link.isLink ? (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-semibold text-foreground">{t("legal")}</h4>
              <ul className="space-y-3">
                {legalLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-3">
            <h4 className="mb-4 text-sm font-semibold text-foreground">{t("contact")}</h4>
            <ul className="space-y-4">
              <li>
                <a
                  href={`mailto:${t("contactEmail")}`}
                  className="flex items-start gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span dir="ltr" className="text-start">{t("contactEmail")}</span>
                </a>
              </li>
              <li>
                <a
                  href={`tel:${t("contactPhone").replace(/\s/g, "")}`}
                  className="flex items-start gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span dir="ltr">{t("contactPhone")}</span>
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{t("contactHours")}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} {tApp("name")}. {tApp("copyright")}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
            {legalLinks.map((link) => (
              <a key={link.label} href={link.href} className="hover:text-foreground transition-colors">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
