import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sanadat",
  description: "Receipt and invoice management platform",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
