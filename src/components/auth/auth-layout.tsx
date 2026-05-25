"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { DocumentPreviewCard } from "@/components/documents/document-preview-card";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const t = useTranslations("app");

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between auth-gradient p-12 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <Logo href="/" />
          <LocaleSwitcher variant="compact" />
        </div>
        <div className="relative flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <DocumentPreviewCard type="receipt_voucher" scale={0.7} />
          </motion.div>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">{t("name")}</h2>
          <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
            {t("description")}
          </p>
        </div>
        <div className="absolute top-1/3 end-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="lg:hidden mb-8 flex items-center justify-between">
          <Logo href="/" />
          <LocaleSwitcher variant="compact" />
        </div>
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle && (
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
