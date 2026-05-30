"use client";

import { useState } from "react";
import { Menu, X, Moon, Sun } from "lucide-react";
import { useTheme } from "@wrksz/themes/client";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { IS_DEMO_MODE, NAV_LINKS } from "@/lib/constants";

export function MarketingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const t = useTranslations("nav");

  return (
    <header className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(link.key)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LocaleSwitcher variant="compact" className="hidden sm:flex" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={t("toggleTheme")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          {IS_DEMO_MODE && (
            <Link href="/dashboard" className="hidden sm:block">
              <Button variant="secondary" size="sm">
                {t("dashboard")}
              </Button>
            </Link>
          )}
          <Link href="/login" className="hidden sm:block">
            <Button variant="ghost" size="sm">
              {t("login")}
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm">{t("register")}</Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={t("openMenu")}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border md:hidden"
          >
            <nav className="flex flex-col gap-1 p-4">
              <div className="pb-3">
                <LocaleSwitcher />
              </div>
              {IS_DEMO_MODE && (
                <Link
                  href="/dashboard"
                  className="rounded-lg px-4 py-3 text-sm font-medium text-primary hover:bg-muted"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("dashboard")}
                </Link>
              )}
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-4 py-3 text-sm hover:bg-muted"
                  onClick={() => setMobileOpen(false)}
                >
                  {t(link.key)}
                </a>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
