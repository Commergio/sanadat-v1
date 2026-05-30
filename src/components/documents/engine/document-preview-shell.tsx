"use client";

import { cn } from "@/lib/utils";

interface DocumentPreviewShellProps {
  previewId: string;
  mode: "detail" | "studio";
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps A4 preview content with consistent export/print targeting.
 * - detail: padded container; preview id on inner node (print/PDF target)
 * - studio: scaled preview for live editor
 */
export function DocumentPreviewShell({
  previewId,
  mode,
  children,
  className,
}: DocumentPreviewShellProps) {
  if (mode === "detail") {
    return (
      <div
        className={cn(
          "overflow-auto rounded-xl bg-muted/30 p-3 sm:p-4 lg:p-8",
          className
        )}
      >
        <div id={previewId} className="mx-auto w-full max-w-[210mm]">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      id={previewId}
      className={cn(
        "document-preview-export-root w-full max-w-[210mm] origin-top shadow-2xl shadow-black/10 transition-transform duration-200",
        "scale-[0.42] sm:scale-[0.52] md:scale-[0.58] lg:scale-[0.72] xl:scale-[0.82] 2xl:scale-[0.9]",
        className
      )}
    >
      {children}
    </div>
  );
}
