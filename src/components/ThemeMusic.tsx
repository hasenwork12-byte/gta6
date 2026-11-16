"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/config";
import { LogoMark } from "@/components/Logo";

// Events browsers count as a real interaction that unlocks sound.
const UNLOCK_EVENTS = ["pointerdown", "mousedown", "click", "touchend", "keydown"] as const;
// The visitor's chosen volume is remembered in their browser (on/off is not: music starts on).
const VOLUME_KEY = "pig-music-volume";

/**
 * Site theme song: on by default and loops forever. Browsers block sound until the visitor
 * interacts, so if autoplay is refused it starts on the first click, tap or key press.
 * The corner pill shows the brand with live bars (click to mute) and a volume slider.
 */
export default function ThemeMusic() {
  const audio = useRef<HTMLAudioElement>(null);
  const muted = useRef(false);
  const [on, setOn] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    let saved = 1;
    try {
      const v = parseFloat(localStorage.getItem(VOLUME_KEY) ?? "");
      if (Number.isFinite(v) && v >= 0 && v <= 1) saved = v;
    } catch {}
    el.volume = saved;
    setVolume(saved);

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
    else {
      // Unmuting from zero volume would stay silent, so bring it back to a sensible level.
      if (el.volume === 0) changeVolume(0.5);
      el.play().catch(() => {});
    }
    setOn(!muted.current);
  };

  const changeVolume = (v: number) => {
    const el = audio.current;
    setVolume(v);
    try {
      localStorage.setItem(VOLUME_KEY, String(v));
    } catch {}
    if (!el) return;
    el.volume = v;
    // Dragging the slider up while muted turns the music back on.
    if (v > 0 && muted.current) {
      muted.current = false;
      setOn(true);
      el.play().catch(() => {});
    }
  };

  const audible = on && volume > 0;
  const live = audible && playing;
  const shown = on ? Math.round(volume * 100) : 0;

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
      <div className="fixed bottom-28 left-4 z-40 flex h-11 items-center gap-2.5 rounded-full border border-accent/40 bg-black/70 pl-1.5 pr-3.5 text-white/90 shadow-[0_0_24px_rgb(var(--accent-1)/0.35)] backdrop-blur transition hover:border-accent lg:bottom-5 lg:left-5">
      <button
        type="button"
        onClick={toggle}
        aria-label={on ? "Mute music" : "Play music"}
        title={on ? "Mute music" : "Play music"}
        className="flex items-center gap-2 transition hover:text-white"
      >
        <LogoMark className="h-8 w-8" />
        <span className="hidden font-display text-sm font-extrabold tracking-tight sm:inline">
          Paid<span className="text-accent">In</span>Games
        </span>
        {audible ? (
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
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={shown}
        onChange={(e) => changeVolume(Number(e.target.value) / 100)}
        aria-label="Music volume"
        title={`Volume ${shown}%`}
        className="vol-range w-20 sm:w-24"
        style={{ ["--vol" as string]: `${shown}%` }}
      />
      </div>
    </>
  );
}
