"use client";

import { Toaster } from "sonner";
import { isRtlLocale } from "@/i18n/routing";

export function Providers({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const dir = isRtlLocale(locale) ? "rtl" : "ltr";

  return (
    <>
      {children}
      <Toaster
        position="top-center"
        dir={dir}
        toastOptions={{
          classNames: {
            toast: "font-sans",
          },
        }}
      />
    </>
  );
}
