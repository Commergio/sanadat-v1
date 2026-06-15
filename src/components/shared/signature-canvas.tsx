"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SignatureCanvasProps {
  onChange?: (hasStroke: boolean) => void;
  className?: string;
  clearLabel: string;
}

export function SignatureCanvas({ onChange, className, clearLabel }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasStroke = useRef(false);
  const [, setTick] = useState(0);

  const getPoint = useCallback((event: MouseEvent | Touch, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }, []);

  const notify = useCallback(() => {
    onChange?.(hasStroke.current);
    setTick((n) => n + 1);
  }, [onChange]);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    hasStroke.current = false;
    notify();
  }, [notify]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const start = (x: number, y: number) => {
      drawing.current = true;
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const draw = (x: number, y: number) => {
      if (!drawing.current) return;
      ctx.lineTo(x, y);
      ctx.stroke();
      if (!hasStroke.current) {
        hasStroke.current = true;
        notify();
      }
    };

    const end = () => {
      drawing.current = false;
    };

    const onMouseDown = (e: MouseEvent) => start(getPoint(e, canvas).x, getPoint(e, canvas).y);
    const onMouseMove = (e: MouseEvent) => draw(getPoint(e, canvas).x, getPoint(e, canvas).y);
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (!touch) return;
      start(getPoint(touch, canvas).x, getPoint(touch, canvas).y);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (!touch) return;
      draw(getPoint(touch, canvas).x, getPoint(touch, canvas).y);
    };

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", end);
    canvas.addEventListener("mouseleave", end);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", end);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", end);
      canvas.removeEventListener("mouseleave", end);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", end);
    };
  }, [getPoint, notify]);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="h-40 w-full touch-none cursor-crosshair"
          aria-label="Signature pad"
        />
      </div>
      <Button type="button" variant="outline" size="sm" onClick={clear}>
        {clearLabel}
      </Button>
    </div>
  );
}
