import Link from "next/link";
import { Logo } from "@/components/logo";
import { APP_NAME } from "@/lib/constants";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground leading-relaxed">
              {APP_NAME} — منصة سعودية موثوقة لرقمنة سندات القبض والصرف والفواتير
              غير الضريبية. جاهزة للامتثال المستقبلي مع وزارة التجارة.
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold">المنتج</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground transition-colors">المميزات</a></li>
              <li><a href="#pricing" className="hover:text-foreground transition-colors">الأسعار</a></li>
              <li><a href="#faq" className="hover:text-foreground transition-colors">الأسئلة الشائعة</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold">الدعم</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/ar/login" className="hover:text-foreground transition-colors">تسجيل الدخول</Link></li>
              <li><Link href="/ar/register" className="hover:text-foreground transition-colors">إنشاء حساب</Link></li>
              <li><a href="mailto:support@sanadat.sa" className="hover:text-foreground transition-colors">support@sanadat.sa</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {APP_NAME}. جميع الحقوق محفوظة.
          </p>
          <p className="text-xs text-muted-foreground">
            صُنع في المملكة العربية السعودية 🇸🇦
          </p>
        </div>
      </div>
    </footer>
  );
}
