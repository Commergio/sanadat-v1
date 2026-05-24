"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { IS_DEMO_MODE } from "@/lib/constants";

export function DemoModeBanner() {
  if (!IS_DEMO_MODE) return null;

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2.5 text-center text-sm">
      <div className="flex flex-wrap items-center justify-center gap-2 text-primary">
        <Eye className="h-4 w-4 shrink-0" />
        <span>
          <strong>وضع المعاينة</strong> — تتصفح المنصة بدون تسجيل دخول (بيانات تجريبية)
        </span>
        <Link href="/ar/login" className="underline font-medium hover:no-underline">
          تسجيل الدخول لاحقاً
        </Link>
      </div>
    </div>
  );
}
