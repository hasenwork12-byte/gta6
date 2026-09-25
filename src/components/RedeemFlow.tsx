"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { points, platformLabel, site } from "@/config";
import { fmtNum, shortAddr } from "@/lib/format";
import { buildRedeemMessage } from "@/lib/redeem-message";
import type { RedemptionKind } from "@/lib/types";
import PointsPanel from "./PointsPanel";
import ClaimGift from "./redeem/ClaimGift";
import DeliveryFields from "./redeem/DeliveryFields";
import { signAndPost } from "./redeem/signAndPost";
import { usePoints } from "./usePoints";
import WalletButton from "./WalletButton";

const KINDS: { id: RedemptionKind; label: string; hint: string }[] = [
  { id: "self", label: "For me", hint: "Get a code for your own PS5 or Xbox." },
  { id: "gift", label: "Gift a wallet", hint: "Send a copy to someone else’s wallet. They claim it here and pick their platform." },
  {
    id: "team",
    label: "Donate to the team",
    hint: `Give the copy to the ${site.name} team for community giveaways and videos. It shows in the public feed with its receipt.`,
  },
];

const B58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export default function RedeemFlow() {
  const { publicKey, signMessage } = useWallet();
  const { info, error: loadError, loading, load } = usePoints();
  const [kind, setKind] = useState<RedemptionKind>("self");
  const [platform, setPlatform] = useState("");
  const [region, setRegion] = useState("");
  const [email, setEmail] = useState("");
  const [recipient, setRecipient] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ id: string; kind: RedemptionKind } | null>(null);

  const wallet = publicKey?.toBase58() ?? null;
  useEffect(() => {
    setDone(null);
    setError(null);
    if (wallet) load(wallet);
  }, [wallet, load]);

  const enoughPoints = !!info && info.points >= info.cost;
  const donationsLeft = info ? Math.max(0, info.donationsMax - info.donationsUsed) : 0;
  const allowed = kind === "self" ? !info?.cooldownUntil : donationsLeft > 0;
  const canRedeem = enoughPoints && allowed;

  const fieldsReady =
    kind === "self" ? !!platform && !!region && !!email : kind === "gift" ? B58.test(recipient.trim()) && recipient.trim() !== wallet : true;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!wallet) return;
    setBusy(true);
    setError(null);
    try {
      const issuedAt = new Date().toISOString();
      const to = recipient.trim();
      const message = buildRedeemMessage({ wallet, kind, recipient: to, platform, region, issuedAt });
      const j = await signAndPost(signMessage, "/api/redeem", message, {
        wallet,
        kind,
        recipient: to,
        platform,
        region,
        email,
        issuedAt,
      });
      setDone({ id: j.id, kind });
      load(wallet);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Redemption failed");
    } finally {
      setBusy(false);
    }
  };

  const blocker = !wallet
    ? "Connect your wallet to redeem."
    : !info
      ? null
      : !enoughPoints
        ? `You need ${fmtNum(points.redeemCost)} points to redeem.`
        : kind === "self" && info.cooldownUntil
          ? `You've redeemed for yourself in the last ${points.cooldownDays} days — you can still gift or donate.`
          : kind !== "self" && donationsLeft === 0
            ? `You've used all ${info.donationsMax} gifts/donations for this ${points.cooldownDays}-day window.`
            : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      {/* Left: wallet + points */}
      <div className="card p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="label">Your points</p>
          <WalletButton />
        </div>
        <div className="mt-6 space-y-6" aria-live="polite">
          {!wallet && (
            <p className="text-sm leading-relaxed text-muted">
              Connect the wallet that holds your tokens. You&apos;ll sign a free message to prove it&apos;s yours — no
              transaction, no fee, and we never ask for your seed phrase.
            </p>
          )}
          {wallet && loading && !info && <p className="text-sm text-muted">Loading points…</p>}
          {loadError && <p className="text-sm text-accent">{loadError}</p>}
          {info?.giftsToClaim.map((g) => (
            <ClaimGift key={g.id} gift={g} onClaimed={() => wallet && load(wallet)} />
          ))}
          {info && <PointsPanel info={info} />}
          {info && (
            <p className="font-mono text-xs text-muted">
              Gifts/donations left this window: <span className="text-fg">{donationsLeft}</span> / {info.donationsMax}
            </p>
          )}
        </div>
      </div>

      {/* Right: redeem form */}
      <div className="card p-5 sm:p-7">
        <p className="label">Redeem · {fmtNum(points.redeemCost)} points</p>

        {done ? (
          <div className="mt-6 space-y-4">
            <p className="text-2xl font-medium text-good">
              {done.kind === "self" ? "Request received ✓" : done.kind === "gift" ? "Gift sent ✓" : "Thank you ✓"}
            </p>
            <p className="text-sm leading-relaxed text-muted">
              Reference <span className="font-mono text-fg">{done.id}</span>. {fmtNum(points.redeemCost)} points were
              reserved.{" "}
              {done.kind === "self" && (
                <>
                  Your {platformLabel(platform)} code will be emailed to <span className="text-fg">{email}</span> once the
                  treasury buys it.
                </>
              )}
              {done.kind === "gift" && (
                <>
                  <span className="font-mono text-fg">{shortAddr(recipient.trim(), 5)}</span> can claim it by connecting
                  that wallet on this page. Share the link with them: <span className="text-fg">/redeem</span>. If it&apos;s
                  never claimed, the team can cancel it and return your points.
                </>
              )}
              {done.kind === "team" && <>The team will use this copy for a community giveaway or video.</>}{" "}
              Requests are filled in order, and the purchase receipt will appear in the public feed.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/redemptions" className="btn-ghost">
                View the redemption feed
              </Link>
              <button onClick={() => setDone(null)} className="btn-ghost">
                Redeem another
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium">Who is it for?</p>
              <div role="radiogroup" aria-label="Who is it for?" className="grid grid-cols-3 gap-1 rounded-xl border border-line/10 p-1">
                {KINDS.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    role="radio"
                    aria-checked={kind === k.id}
                    onClick={() => {
                      setKind(k.id);
                      setError(null);
                    }}
                    className={`rounded-lg px-2 py-2 text-xs transition sm:text-sm ${
                      kind === k.id ? "bg-line/[0.1] font-semibold text-fg" : "text-muted hover:text-fg"
                    }`}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">{KINDS.find((k) => k.id === kind)!.hint}</p>
            </div>

            <fieldset disabled={!canRedeem || busy} className="space-y-5 disabled:opacity-60">
              {kind === "self" && (
                <DeliveryFields
                  idPrefix="self"
                  platform={platform}
                  setPlatform={setPlatform}
                  region={region}
                  setRegion={setRegion}
                  email={email}
                  setEmail={setEmail}
                />
              )}

              {kind === "gift" && (
                <div>
                  <label htmlFor="recipient" className="mb-2 block text-sm font-medium">
                    Recipient wallet
                  </label>
                  <input
                    id="recipient"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    required
                    spellCheck={false}
                    autoComplete="off"
                    placeholder="Solana wallet address"
                    className="h-[42px] w-full rounded-full border border-line/15 bg-bg/60 px-5 font-mono text-sm outline-none placeholder:text-muted focus:border-accent/60"
                  />
                  <p className="mt-1.5 text-xs text-muted">
                    Double-check the address — only that wallet can claim the gift.
                  </p>
                </div>
              )}

              {kind === "team" && (
                <div className="rounded-xl border border-line/[0.08] bg-bg/40 p-4 text-sm leading-relaxed text-muted">
                  The copy goes to the {site.name} team and is used only for community giveaways and videos — never
                  resold. It&apos;s listed in the public feed as a team donation from your wallet, with the purchase
                  receipt once bought.
                </div>
              )}

              <label className="flex items-start gap-3 text-xs leading-relaxed text-muted">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  required
                  className="mt-0.5 accent-[rgb(var(--accent-1))]"
                />
                <span>
                  I&apos;ve read the <Link href="/terms" className="link">redemption terms</Link> and{" "}
                  <Link href="/disclosures" className="link">disclosures</Link>
                  {kind === "self" ? ", and redeeming a game is allowed where I live" : ""}. I understand fulfilment
                  depends on the treasury balance{kind !== "self" ? " and that spent points aren't returned once the copy is claimed or used" : ""}.
                </span>
              </label>

              <button className="btn-primary w-full" disabled={!fieldsReady || !agree}>
                {busy
                  ? "Waiting for signature…"
                  : kind === "self"
                    ? "Sign & redeem"
                    : kind === "gift"
                      ? "Sign & send gift"
                      : "Sign & donate"}
              </button>
            </fieldset>

            {blocker && <p className="text-xs text-muted">{blocker}</p>}
            {error && <p className="text-sm text-accent">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
