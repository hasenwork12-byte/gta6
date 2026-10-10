"use client";

import { useState } from "react";

/** A revealed game code: big and easy to read, with a copy button. */
export default function RevealedCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
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
    </div>
  );
}
