"use client";

import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { generateWhatsAppLink } from "@/lib/utils";
import { SUPPORT_WHATSAPP_E164 } from "@/lib/constants";

export function FloatingSupport() {
  const t = useTranslations("support");
  const link = generateWhatsAppLink(SUPPORT_WHATSAPP_E164, t("message"));

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed z-50 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl sm:h-14 sm:w-14"
      style={{
        bottom: "max(1.25rem, env(safe-area-inset-bottom, 0px))",
        insetInlineStart: "max(1rem, env(safe-area-inset-left, 0px))",
      }}
      aria-label={t("whatsapp")}
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
