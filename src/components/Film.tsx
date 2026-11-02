"use client";

import { useEffect, useRef } from "react";
import SectionHeading from "./SectionHeading";

/** Silent product film. The type carries the rules, so it can play under the site song. */
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
      <SectionHeading
        eyebrow="The loop"
        title="How $PIG pays."
        sub="The rules, in one pass."
      />
      <div className="card overflow-hidden">
        <video
          ref={video}
          className="aspect-video w-full bg-black"
          src="/video/explainer.mp4?v=2"
          muted
          loop
          autoPlay
          playsInline
          preload="auto"
          aria-label="How Paid In Games pays. Hold $PIG, stack XP, claim GTA 6."
        />
      </div>
    </section>
  );
}
