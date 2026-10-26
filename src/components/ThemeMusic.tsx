"use client";

import { useEffect, useRef, useState } from "react";

// Events browsers count as a real interaction that unlocks sound.
const UNLOCK_EVENTS = ["pointerdown", "mousedown", "click", "touchend", "keydown"] as const;

/**
 * Site theme song: on by default and loops forever. Browsers block sound until the visitor
 * interacts, so if autoplay is refused it starts on the first click, tap or key press.
 * The corner button lets visitors mute it.
 */
export default function ThemeMusic() {
  const audio = useRef<HTMLAudioElement>(null);
  const muted = useRef(false);
  const [on, setOn] = useState(true);

  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    el.volume = 1;

    const unlock = () => {
      if (muted.current) return stop();
      el.play().then(stop).catch(() => {});
    };
    const stop = () => UNLOCK_EVENTS.forEach((e) => window.removeEventListener(e, unlock, true));

    UNLOCK_EVENTS.forEach((e) => window.addEventListener(e, unlock, true));
    el.play().then(stop).catch(() => {});
    return stop;
  }, []);

  const toggle = () => {
    const el = audio.current;
    if (!el) return;
    muted.current = !muted.current;
    if (muted.current) el.pause();
    else el.play().catch(() => {});
    setOn(!muted.current);
  };

  return (
    <>
      <audio ref={audio} src="/audio/theme.mp3" loop autoPlay preload="auto" />
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
