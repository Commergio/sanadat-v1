"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/auth/client";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      toast.success("تم تسجيل الخروج");
      router.push("/ar/login");
      router.refresh();
    } catch {
      toast.error("فشل تسجيل الخروج");
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-2 text-muted-foreground"
      onClick={handleSignOut}
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">خروج</span>
    </Button>
  );
}
