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
 * Scales A4 content to fit the container width without horizontal page scroll.
 * PDF export resets transforms via `body.pdf-exporting` in globals.css.
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

  const scaledWidth = A4_WIDTH_PX * scale;
  const scaledHeight = A4_HEIGHT_PX * scale;

  return (
    <div ref={containerRef} className={cn("a4-scale-container w-full", className)}>
      <div
        className="a4-scale-frame relative mx-auto shrink-0"
        style={{ width: scaledWidth, height: scaledHeight }}
      >
        <div
          className="a4-scale-content absolute top-0 left-1/2 origin-top"
          style={{
            width: A4_WIDTH_PX,
            transform: `translateX(-50%) scale(${scale})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
