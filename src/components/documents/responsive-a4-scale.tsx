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
  /** Also constrain scale to fit container height */
  fitHeight?: boolean;
}

/**
 * Scales A4 content to fit the container.
 * Uses `zoom` (not transform) to preserve Arabic cursive joining in preview.
 */
export function ResponsiveA4Scale({
  children,
  className,
  maxScale = 1,
  padding = 8,
  fitHeight = false,
}: ResponsiveA4ScaleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.42);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const availableW = Math.max(0, el.clientWidth - padding * 2);
      const scaleW = availableW / A4_WIDTH_PX;
      let next = scaleW;

      if (fitHeight) {
        const availableH = Math.max(0, el.clientHeight - padding * 2);
        const scaleH = availableH / A4_HEIGHT_PX;
        next = Math.min(scaleW, scaleH);
      }

      setScale(Math.min(maxScale, Math.max(0.26, next)));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("orientationchange", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", update);
    };
  }, [maxScale, padding, fitHeight]);

  return (
    <div
      ref={containerRef}
      className={cn("a4-scale-container", fitHeight && "h-full min-h-0", className)}
    >
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
