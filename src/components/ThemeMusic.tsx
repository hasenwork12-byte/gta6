"use client";

import { useEffect, useRef, useState } from "react";

const MUTE_KEY = "pig-music-muted";

/**
 * Site theme song: starts on load and loops forever. Browsers block sound until the visitor
 * interacts, so if autoplay is refused it starts on the first click, tap or key press.
 * The corner button mutes it, and the choice is remembered.
 */
export default function ThemeMusic() {
  const audio = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    el.volume = 0.5;
    let off = false;
    try {
      off = localStorage.getItem(MUTE_KEY) === "1";
    } catch {}
    setMuted(off);
    if (off) return;

    const events = ["pointerdown", "keydown", "touchstart"] as const;
    const unlock = () => {
      el.play().then(() => events.forEach((e) => window.removeEventListener(e, unlock))).catch(() => {});
    };
    el.play().catch(() => events.forEach((e) => window.addEventListener(e, unlock)));
    return () => events.forEach((e) => window.removeEventListener(e, unlock));
  }, []);

  const toggle = () => {
    const el = audio.current;
    if (!el) return;
    const next = !(muted || !playing);
    if (next) el.pause();
    else el.play().catch(() => {});
    setMuted(next);
    try {
      localStorage.setItem(MUTE_KEY, next ? "1" : "0");
    } catch {}
  };

  const on = playing && !muted;

  return (
    <>
      <audio
        ref={audio}
        src="/audio/theme.mp3"
        loop
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={on ? "Mute music" : "Play music"}
        title={on ? "Mute music" : "Play music"}
        className="fixed bottom-28 left-4 z-40 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/60 text-white/80 backdrop-blur transition hover:text-white lg:bottom-5 lg:left-5"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M11 5 6 9H2v6h4l5 4z" />
          {on ? (
            <>
              <path d="M15.5 8.5a5 5 0 0 1 0 7" />
              <path d="M19 5a10 10 0 0 1 0 14" />
            </>
          ) : (
            <path d="m22 9-6 6M16 9l6 6" />
          )}
        </svg>
      </button>
    </>
  );
}
