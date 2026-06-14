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
    <div className={cn("relative mx-auto w-full max-w-[560px] lg:max-w-[620px]", className)}>
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[90px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, delay: 0.15, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="relative"
      >
        {/* Laptop screen */}
        <div className="rounded-[1.25rem] border border-zinc-700/80 bg-gradient-to-b from-zinc-800 to-zinc-900 p-2.5 shadow-2xl shadow-zinc-900/25 sm:p-3.5 dark:border-zinc-600/60">
          <div className="mb-2.5 flex items-center justify-center gap-1.5 sm:mb-3">
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-600/90" aria-hidden />
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-500/80" aria-hidden />
          </div>

          <div className="relative overflow-hidden rounded-xl border border-zinc-950/40 bg-black shadow-inner">
            <div className="aspect-[16/10] w-full">
              <video
                ref={videoRef}
                className="h-full w-full object-cover object-top"
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
            <div
              className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10"
              aria-hidden
            />
          </div>
        </div>

        {/* Laptop hinge + keyboard base */}
        <div
          className="relative mx-auto h-2.5 w-[98%] rounded-b-sm bg-gradient-to-b from-zinc-600 to-zinc-700 shadow-md"
          aria-hidden
        />
        <div
          className="relative mx-auto h-5 w-[108%] max-w-none -translate-x-[4%] rounded-b-[1.1rem] bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 shadow-xl sm:h-6"
          aria-hidden
        >
          <div className="absolute top-0 left-1/2 h-1 w-14 -translate-x-1/2 rounded-b-md bg-zinc-600/80 sm:w-20" />
        </div>

        <div
          className="mx-auto mt-5 h-5 w-[72%] rounded-full bg-zinc-900/15 blur-xl dark:bg-black/30"
          aria-hidden
        />
      </motion.div>
    </div>
  );
}
