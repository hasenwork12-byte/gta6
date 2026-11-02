"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/config";
import { LogoMark } from "@/components/Logo";

// Events browsers count as a real interaction that unlocks sound.
const UNLOCK_EVENTS = ["pointerdown", "mousedown", "click", "touchend", "keydown"] as const;

/**
 * Site theme song: on by default and loops forever. Browsers block sound until the visitor
 * interacts, so if autoplay is refused it starts on the first click, tap or key press.
 * The corner pill shows the brand with live bars and lets visitors mute it.
 */
export default function ThemeMusic() {
  const audio = useRef<HTMLAudioElement>(null);
  const muted = useRef(false);
  const [on, setOn] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    el.volume = 1;

    // Phone lock screens and browser media controls show the brand instead of the file name.
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: site.name,
        artist: `$${site.ticker}`,
        artwork: [{ src: "/apple-icon", sizes: "180x180", type: "image/png" }],
      });
    }

    const tryPlay = () => {
      if (muted.current) return;
      el.play().then(stop).catch(() => {});
    };
    const stop = () => UNLOCK_EVENTS.forEach((e) => window.removeEventListener(e, tryPlay, true));

    UNLOCK_EVENTS.forEach((e) => window.addEventListener(e, tryPlay, true));
    el.addEventListener("canplay", tryPlay);
    el.addEventListener("loadeddata", tryPlay);
    tryPlay();
    const retries = [150, 600, 1400, 2800].map((ms) => window.setTimeout(tryPlay, ms));

    return () => {
      stop();
      el.removeEventListener("canplay", tryPlay);
      el.removeEventListener("loadeddata", tryPlay);
      retries.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const toggle = () => {
    const el = audio.current;
    if (!el) return;
    muted.current = !muted.current;
    if (muted.current) el.pause();
    else el.play().catch(() => {});
    setOn(!muted.current);
  };

  const live = on && playing;

  return (
    <>
      <audio
        ref={audio}
        src="/audio/theme.mp3"
        loop
        autoPlay
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={on ? "Mute music" : "Play music"}
        title={on ? "Mute music" : "Play music"}
        className="fixed bottom-28 left-4 z-40 flex h-11 items-center gap-2 rounded-full border border-accent/40 bg-black/70 pl-1.5 pr-3 sm:pr-3.5 text-white/90 shadow-[0_0_24px_rgb(var(--accent-1)/0.35)] backdrop-blur transition hover:border-accent hover:text-white lg:bottom-5 lg:left-5"
      >
        <LogoMark className="h-8 w-8" />
        <span className="hidden font-display text-sm font-extrabold tracking-tight sm:inline">
          Paid<span className="text-accent">In</span>Games
        </span>
        {on ? (
          <span className="flex h-4 items-end gap-[3px]" aria-hidden>
            {[0, 0.25, 0.5, 0.15].map((delay) => (
              <span
                key={delay}
                className={`h-full w-[3px] origin-bottom rounded-full bg-accent ${live ? "animate-eq" : "scale-y-[0.3]"}`}
                style={{ animationDelay: `${delay}s` }}
              />
            ))}
          </span>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-white/60" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M11 5 6 9H2v6h4l5 4z" />
            <path d="m22 9-6 6M16 9l6 6" />
          </svg>
        )}
      </button>
    </>
  );
}
