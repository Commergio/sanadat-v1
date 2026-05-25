"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { getSupabaseBrowserClient } from "@/lib/auth/client";

export function SignOutButton() {
  const t = useTranslations("auth");
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      toast.success(t("logoutSuccess"));
      router.push("/login");
      router.refresh();
    } catch {
      toast.error(t("logoutFailed"));
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
      <span className="hidden sm:inline">{t("logout")}</span>
    </Button>
  );
}
