"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const INTRO_VIDEO_SRC = "/videos/sanadat-intro.mp4";

interface HeroIntroVideoProps {
  className?: string;
}

export function HeroIntroVideo({ className }: HeroIntroVideoProps) {
  const t = useTranslations("hero");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    const play = () => {
      void video.play().catch(() => {});
    };

    play();
    video.addEventListener("loadeddata", play);
    return () => video.removeEventListener("loadeddata", play);
  }, []);

  return (
    <div className={cn("relative mx-auto w-full max-w-[640px] lg:max-w-[720px]", className)}>
      {/* Ambient tech glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/12 blur-[100px]" />
        <div className="absolute top-1/4 end-0 h-40 w-40 rounded-full bg-violet-500/10 blur-[80px]" />
        <div className="absolute bottom-1/4 start-0 h-32 w-32 rounded-full bg-cyan-400/10 blur-[70px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, delay: 0.15, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="relative"
      >
        {/* Animated gradient ring — high-tech accent outside the frame */}
        <div
          className="pointer-events-none absolute -inset-[1px] rounded-[2rem] bg-gradient-to-br from-primary/40 via-violet-500/20 to-cyan-400/30 opacity-60 blur-sm sm:rounded-[2.25rem]"
          aria-hidden
        />
        <motion.div
          className="pointer-events-none absolute -inset-3 rounded-[2.2rem] border border-primary/15 sm:-inset-4 sm:rounded-[2.5rem]"
          animate={{ opacity: [0.35, 0.65, 0.35] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />

        {/* Tablet body — light frame wraps outside video area */}
        <div className="relative overflow-hidden rounded-[1.75rem] border border-white/40 bg-gradient-to-b from-white/90 via-slate-50/95 to-slate-100/90 p-2 shadow-[0_24px_64px_-16px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:rounded-[2rem] sm:p-2.5 dark:border-white/10 dark:from-zinc-900/90 dark:via-zinc-900/80 dark:to-zinc-950/90 dark:shadow-[0_24px_64px_-16px_rgba(0,0,0,0.45)]">
          {/* Top bezel — outside video */}
          <div className="mb-2 flex items-center justify-center sm:mb-2">
            <span className="h-1 w-8 rounded-full bg-slate-300/80 dark:bg-zinc-600/70" aria-hidden />
            <span
              className="mx-auto h-1.5 w-1.5 rounded-full bg-slate-300 ring-2 ring-slate-200/80 dark:bg-zinc-600 dark:ring-zinc-700/80"
              aria-hidden
            />
            <span className="h-1 w-8 rounded-full bg-transparent" aria-hidden />
          </div>

          {/* Video viewport — wide landscape screen matching 16:9 recording */}
          <div className="relative overflow-hidden rounded-[0.9rem] bg-black shadow-inner ring-1 ring-slate-900/5 sm:rounded-[1rem] dark:ring-white/5">
            <div className="aspect-video w-full">
              <video
                ref={videoRef}
                className="h-full w-full object-cover object-center"
                autoPlay
                loop
                muted
                playsInline
                disablePictureInPicture
                preload="auto"
                aria-label={t("videoAriaLabel")}
              >
                <source src={INTRO_VIDEO_SRC} type="video/mp4" />
              </video>
            </div>
          </div>

          {/* Bottom bezel — home indicator, outside video */}
          <div className="mt-2 flex justify-center sm:mt-2">
            <span
              className="h-0.5 w-12 rounded-full bg-slate-300/70 dark:bg-zinc-600/60"
              aria-hidden
            />
          </div>
        </div>

        {/* Side accent lines — tech feel */}
        <div
          className="pointer-events-none absolute top-1/4 -start-6 hidden h-16 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent lg:block"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-1/4 -end-6 hidden h-16 w-px bg-gradient-to-b from-transparent via-violet-500/30 to-transparent lg:block"
          aria-hidden
        />

        <div
          className="mx-auto mt-6 h-4 w-[65%] rounded-full bg-slate-900/10 blur-xl dark:bg-black/35"
          aria-hidden
        />
      </motion.div>
    </div>
  );
}
