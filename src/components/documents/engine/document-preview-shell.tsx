"use client";

import { ResponsiveA4Scale } from "@/components/documents/responsive-a4-scale";
import { cn } from "@/lib/utils";

interface DocumentPreviewShellProps {
  previewId: string;
  mode: "detail" | "studio";
  /** Studio preview sizing: default split view vs full-screen preview */
  studioVariant?: "default" | "full";
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps A4 preview content with consistent export/print targeting.
 * Uses ResponsiveA4Scale so preview fits phones/tablets without horizontal scroll.
 */
export function DocumentPreviewShell({
  previewId,
  mode,
  studioVariant = "default",
  children,
  className,
}: DocumentPreviewShellProps) {
  const isFullStudio = mode === "studio" && studioVariant === "full";
  const maxScale = isFullStudio ? 1 : mode === "studio" ? 0.92 : 1;

  return (
    <div
      id={previewId}
      className={cn(
        "document-preview-export-root w-full",
        mode === "detail" &&
          "overflow-hidden rounded-xl bg-muted/30 p-2 sm:p-4 lg:p-6",
        mode === "studio" && "shadow-2xl shadow-black/10",
        isFullStudio && "flex h-full min-h-0 flex-col justify-center",
        className
      )}
    >
      <ResponsiveA4Scale
        maxScale={maxScale}
        padding={mode === "studio" ? 8 : 12}
        fitHeight={isFullStudio}
        className={isFullStudio ? "flex-1" : undefined}
      >
        {children}
      </ResponsiveA4Scale>
    </div>
  );
}
