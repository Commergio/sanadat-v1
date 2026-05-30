"use client";

import { useEffect, useRef, useState } from "react";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

export function useDraftAutosave<T>(storageKey: string, data: T, enabled = true) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!enabled || isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setStatus("saving");
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(data));
        setStatus("saved");
        setLastSavedAt(new Date());
      } catch {
        setStatus("error");
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [data, storageKey, enabled]);

  return { status, lastSavedAt };
}

export function loadDraft<T>(storageKey: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearDraft(storageKey: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey);
}
