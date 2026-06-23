import { getTranslations } from "next-intl/server";
import { Mail, MapPin, Phone } from "lucide-react";
import { StaticPageShell } from "@/components/marketing/static-page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { SUPPORT_WHATSAPP_E164 } from "@/lib/constants";

export default async function ContactPage() {
  const t = await getTranslations("staticPages.contact");

  return (
    <StaticPageShell title={t("title")} updated={t("updated")}>
      <p className="text-muted-foreground leading-relaxed">{t("intro")}</p>

      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium">{t("emailLabel")}</p>
              <a
                href={`mailto:${t("emailValue")}`}
                className="text-sm text-primary hover:underline"
                dir="ltr"
              >
                {t("emailValue")}
              </a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium">{t("phoneLabel")}</p>
              <a
                href={`https://wa.me/${SUPPORT_WHATSAPP_E164}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
                dir="ltr"
              >
                {t("phoneValue")}
              </a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium">{t("hoursLabel")}</p>
              <p className="text-sm text-muted-foreground">{t("hoursValue")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">{t("supportTitle")}</h2>
        <p className="text-muted-foreground leading-relaxed">{t("supportBody")}</p>
      </section>
    </StaticPageShell>
  );
}
