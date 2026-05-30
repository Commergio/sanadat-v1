"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** A4 dimensions at 96dpi (210mm × 297mm) */
export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1123;

interface ResponsiveA4ScaleProps {
  children: React.ReactNode;
  className?: string;
  /** Maximum scale (1 = full A4 width) */
  maxScale?: number;
  /** Horizontal padding inside the measurement container */
  padding?: number;
}

/**
 * Scales A4 content to fit the container width.
 * Uses `zoom` (not transform) to preserve Arabic cursive joining in preview.
 */
export function ResponsiveA4Scale({
  children,
  className,
  maxScale = 1,
  padding = 8,
}: ResponsiveA4ScaleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.42);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const available = Math.max(0, el.clientWidth - padding * 2);
      const next = Math.min(maxScale, Math.max(0.26, available / A4_WIDTH_PX));
      setScale(next);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("orientationchange", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", update);
    };
  }, [maxScale, padding]);

  return (
    <div ref={containerRef} className={cn("a4-scale-container", className)}>
      <div
        className="a4-scale-content mx-auto"
        style={{
          width: A4_WIDTH_PX,
          zoom: scale,
        }}
      >
        {children}
      </div>
    </div>
  );
}
