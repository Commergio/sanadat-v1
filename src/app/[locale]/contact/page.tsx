import { getTranslations } from "next-intl/server";
import { Mail, MapPin, Phone } from "lucide-react";
import { StaticPageShell } from "@/components/marketing/static-page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { SUPPORT_CONTACT_PHONES } from "@/lib/constants";

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
            <div className="space-y-1">
              <p className="font-medium">{t("phoneLabel")}</p>
              {SUPPORT_CONTACT_PHONES.map((phone) => (
                <a
                  key={phone.e164}
                  href={
                    phone.whatsapp
                      ? `https://wa.me/${phone.e164}`
                      : `tel:+${phone.e164}`
                  }
                  target={phone.whatsapp ? "_blank" : undefined}
                  rel={phone.whatsapp ? "noopener noreferrer" : undefined}
                  className="block text-sm text-primary hover:underline"
                  dir="ltr"
                >
                  {phone.display}
                </a>
              ))}
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
