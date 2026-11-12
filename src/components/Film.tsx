"use client";

import { useEffect, useRef } from "react";

/** Silent trailer-style film: hold, stack XP, avoid WASTED, mission passed. Plays under the site song. */
export default function Film() {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    const tryPlay = () => {
      el.muted = true;
      el.play().catch(() => {});
    };
    el.muted = true;
    el.addEventListener("canplay", tryPlay);
    el.addEventListener("loadeddata", tryPlay);
    tryPlay();
    const retries = [100, 400, 1000].map((ms) => window.setTimeout(tryPlay, ms));
    return () => {
      el.removeEventListener("canplay", tryPlay);
      el.removeEventListener("loadeddata", tryPlay);
      retries.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  return (
    <section id="film" className="section mt-2 scroll-mt-24 sm:mt-4">
      <div className="overflow-hidden rounded-3xl border border-line/10">
        <video
          ref={video}
          className="aspect-video w-full bg-[#0b0710]"
          src="/video/film.mp4"
          muted
          loop
          autoPlay
          playsInline
          preload="auto"
          aria-label="How Paid In Games pays. Hold $PIG, earn XP, claim GTA 6."
        />
      </div>
    </section>
  );
}
