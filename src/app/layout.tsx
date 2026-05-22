import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "نظام السندات | إدارة سندات القبض والصرف والفواتير",
  description:
    "منصة سعودية لرقمنة سندات القبض والصرف والفواتير غير الضريبية للمنشآت الصغيرة — بسيطة، آمنة، وجاهزة للامتثال.",
  keywords: [
    "سندات قبض",
    "سندات صرف",
    "فواتير",
    "السعودية",
    "منشآت صغيرة",
  ],
  openGraph: {
    title: "نظام السندات",
    description: "وداعاً للسندات الورقية — إدارة احترافية للمستندات المالية",
    locale: "ar_SA",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
