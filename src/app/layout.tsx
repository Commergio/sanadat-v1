import type { Metadata } from "next";
import { buildSiteMetadata } from "@/lib/metadata/site-branding";

export const metadata: Metadata = buildSiteMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
