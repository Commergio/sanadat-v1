"use client";

import { useTranslations } from "next-intl";
import { useCompany } from "@/hooks/use-company";

export function useDashboardGreeting() {
  const t = useTranslations("dashboard");
  const { company } = useCompany();
  const name = company?.name ?? t("guest");

  return {
    title: t("docGreeting", { name }),
    description: t("docGreetingDesc"),
  };
}
