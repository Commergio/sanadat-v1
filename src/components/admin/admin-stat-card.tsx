import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface AdminStatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  trend?: string;
  accent?: "default" | "success" | "warning" | "primary";
}

export function AdminStatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  accent = "default",
}: AdminStatCardProps) {
  return (
    <div className="dashboard-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
          {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
          {trend ? (
            <p className="mt-1 text-[11px] font-semibold text-emerald-600">{trend}</p>
          ) : null}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            accent === "success" && "bg-emerald-500/10 text-emerald-600",
            accent === "warning" && "bg-amber-500/10 text-amber-600",
            accent === "primary" && "bg-primary/10 text-primary",
            accent === "default" && "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
