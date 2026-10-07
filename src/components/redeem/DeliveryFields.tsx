"use client";

import Image from "next/image";
import { points, stockKey } from "@/config";

/** Platform cards (cover art, platform colour), store region and delivery email. */
export default function DeliveryFields({
  idPrefix,
  platform,
  setPlatform,
  region,
  setRegion,
  email,
  setEmail,
  stock,
}: {
  stock: Record<string, number>;
  idPrefix: string;
  platform: string;
  setPlatform: (v: string) => void;
  region: string;
  setRegion: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
}) {
  return (
    <>
      <div>
        <p className="mb-2 text-sm font-medium">Platform</p>
        <div className="grid grid-cols-2 gap-3">
          {points.platforms.map((p) => {
            const selected = platform === p.id;
            return (
              <label
                key={p.id}
                style={{
                  borderColor: selected ? p.color : undefined,
                  boxShadow: selected ? `0 0 0 1px ${p.color}, 0 8px 30px -12px ${p.color}` : undefined,
                }}
                className={`group relative cursor-pointer overflow-hidden rounded-xl border text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/70 ${
                  selected ? "" : "border-line/15 hover:border-line/30"
                }`}
              >
                <input
                  type="radio"
                  name={`${idPrefix}-platform`}
                  value={p.id}
                  className="sr-only"
                  checked={selected}
                  onChange={() => setPlatform(p.id)}
                  required
                />
                <div className="relative aspect-[16/10] overflow-hidden bg-bg">
                  <Image
                    src="/images/gta6-cover.jpg"
                    alt={`Grand Theft Auto VI cover art — ${p.label}`}
                    fill
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 40vw, 240px"
                    className={`object-cover transition duration-300 ${selected ? "scale-105" : "opacity-80 group-hover:opacity-100"}`}
                  />
                  {selected && (
                    <span
                      className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full text-xs font-bold text-white"
                      style={{ background: p.color }}
                      aria-hidden
                    >
                      ✓
                    </span>
                  )}
                </div>
                <div className="px-3 py-2.5 text-center text-white" style={{ background: p.color }}>
                  <span className="block text-[11px] font-medium uppercase tracking-wider opacity-80">GTA 6</span>
                  <span className="block font-semibold">{p.label}</span>
                </div>
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-muted">Game artwork © Rockstar Games. Shown to identify the product.</p>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-region`} className="mb-2 block text-sm font-medium">
          Store region
        </label>
        <select
          id={`${idPrefix}-region`}
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          required
          className="h-[42px] w-full rounded-full border border-line/15 bg-bg/60 px-4 text-sm outline-none focus:border-accent/60"
        >
          <option value="">Select…</option>
          {points.regions.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        {platform && region && (
          <p className={`mt-2 text-xs ${(stock[stockKey(platform, region)] ?? 0) > 0 ? "text-good" : "text-amber-300"}`}>
            {(stock[stockKey(platform, region)] ?? 0) > 0
              ? `In stock: your code is delivered instantly on this page.`
              : "Out of stock right now — you'll join the queue and get a code automatically when stock arrives."}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={`${idPrefix}-email`} className="mb-2 block text-sm font-medium">
          Email <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id={`${idPrefix}-email`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="h-[42px] w-full rounded-full border border-line/15 bg-bg/60 px-5 text-sm outline-none placeholder:text-muted focus:border-accent/60"
        />
        <p className="mt-1.5 text-xs text-muted">
          Codes are shown here after you sign with your wallet. Add an email only if you&apos;d like a heads-up when a
          queued code is ready. Kept private.
        </p>
      </div>
    </>
  );
}
