"use client";

import { CheckCircle2, AlertCircle, Lock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface StudioFieldProps {
  label: string;
  hint?: string;
  error?: string;
  showValid?: boolean;
  required?: boolean;
  locked?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

export function StudioField({
  label,
  hint,
  error,
  showValid,
  required,
  locked,
  htmlFor,
  children,
  className,
}: StudioFieldProps) {
  const hasError = Boolean(error);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label
          htmlFor={htmlFor}
          className={cn(
            "text-sm font-medium",
            hasError && "text-destructive",
            showValid && !hasError && "text-emerald-700 dark:text-emerald-400"
          )}
        >
          {label}
          {required && <span className="text-destructive ms-0.5">*</span>}
          {locked && <Lock className="ms-1.5 inline h-3 w-3 text-muted-foreground" />}
        </Label>
        {showValid && !hasError && (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
        )}
        {hasError && (
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" aria-hidden />
        )}
      </div>
      <div
        className={cn(
          "rounded-lg transition-shadow",
          hasError && "[&_input]:border-destructive [&_textarea]:border-destructive [&_button]:border-destructive",
          showValid && !hasError && "[&_input]:border-emerald-500/50 [&_textarea]:border-emerald-500/50"
        )}
      >
        {children}
      </div>
      {hasError && (
        <p className="flex items-center gap-1.5 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
      {hint && !hasError && (
        <p className="text-[11px] leading-relaxed text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
