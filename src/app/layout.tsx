import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sanadat",
  description: "Receipt and invoice management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
