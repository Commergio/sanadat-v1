"use client";

import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { generateWhatsAppLink } from "@/lib/utils";

export function FloatingSupport() {
  const t = useTranslations("support");
  const link = generateWhatsAppLink("966500000000", t("message"));

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 start-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl sm:bottom-6 sm:start-6 sm:h-14 sm:w-14"
      aria-label={t("whatsapp")}
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
