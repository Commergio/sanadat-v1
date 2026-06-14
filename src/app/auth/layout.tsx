import "../globals.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen min-w-0 bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
