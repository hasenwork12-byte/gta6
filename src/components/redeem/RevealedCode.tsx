"use client";

import { useRef, useState } from "react";
import { demoRevealSong } from "@/config";

/** A revealed game code: big and easy to read, with a copy button. In demo mode it also plays the reveal song. */
export default function RevealedCode({ code, demo = false }: { code: string; demo?: boolean }) {
  const [copied, setCopied] = useState(false);
  const player = useRef<HTMLIFrameElement>(null);
  const song = demo && demoRevealSong.youtubeId ? demoRevealSong : null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  // Full volume once the YouTube player is up (its JS API takes commands over postMessage).
  const loud = () => {
    const send = (func: string, args: unknown[] = []) =>
      player.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
    for (const ms of [300, 1000, 2500]) {
      setTimeout(() => {
        send("unMute");
        send("setVolume", [100]);
        send("playVideo");
      }, ms);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-good/30 bg-good/10 p-4">
      <code
        dir="auto"
        className="block select-all break-words text-center font-display text-4xl font-extrabold leading-tight text-good sm:text-5xl"
      >
        {code}
      </code>
      <div className="mt-3 flex justify-center">
        <button onClick={copy} className="btn-ghost !py-2 text-xs">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {song && (
        <iframe
          ref={player}
          onLoad={loud}
          title="Reveal song"
          className="mx-auto mt-4 aspect-video w-full max-w-sm rounded-lg"
          src={`https://www.youtube.com/embed/${song.youtubeId}?autoplay=1&start=${song.start}&enablejsapi=1&playsinline=1`}
          allow="autoplay; encrypted-media"
        />
      )}
    </div>
  );
}
