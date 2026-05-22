"use client";

import { MessageCircle } from "lucide-react";
import { generateWhatsAppLink } from "@/lib/utils";

export function FloatingSupport() {
  const link = generateWhatsAppLink(
    "966500000000",
    "مرحباً، أحتاج مساعدة في نظام السندات"
  );

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
      aria-label="دعم واتساب"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
