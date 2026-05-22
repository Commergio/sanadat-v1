import Link from "next/link";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

interface LogoProps {
  className?: string;
  showText?: boolean;
  href?: string;
}

export function Logo({ className, showText = true, href = "/ar" }: LogoProps) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5 group", className)}>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm transition-transform group-hover:scale-105">
        <FileText className="h-5 w-5 text-primary-foreground" />
      </div>
      {showText && (
        <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
      )}
    </Link>
  );
}
