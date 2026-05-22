"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  Bell,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";

const navItems = [
  { href: "/ar/admin", label: "نظرة عامة", icon: LayoutDashboard },
  { href: "/ar/admin/clients", label: "العملاء", icon: Users },
  { href: "/ar/admin/subscriptions", label: "الاشتراكات", icon: CreditCard },
  { href: "/ar/admin/payments", label: "المدفوعات", icon: CreditCard },
  { href: "/ar/admin/analytics", label: "التحليلات", icon: BarChart3 },
  { href: "/ar/admin/notifications", label: "الإشعارات", icon: Bell },
  { href: "/ar/admin/whatsapp", label: "قوالب واتساب", icon: MessageSquare },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-l border-border bg-card min-h-screen hidden lg:block">
      <div className="h-16 flex items-center px-5 border-b border-border">
        <Logo href="/ar/admin" />
        <span className="mr-2 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">إدارة</span>
      </div>
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
