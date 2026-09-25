"use client";

import { FormEvent, useState } from "react";
import { platformLabel, points, stockKey } from "@/config";

/** Stock levels + form to add purchased codes (they are encrypted server-side). */
export default function AdminStock({
  stock,
  call,
  onChanged,
}: {
  stock: Record<string, number>;
  call: (body: Record<string, unknown>) => Promise<Record<string, unknown>>;
  onChanged: () => void;
}) {
  const [platform, setPlatform] = useState<string>(points.platforms[0].id);
  const [region, setRegion] = useState(points.regions[0]);
  const [tx, setTx] = useState("");
  const [codes, setCodes] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const count = codes.split(/\r?\n/).filter((c) => c.trim()).length;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await call({ action: "addStock", platform, region, tx, codes });
      setMsg(`Added ${res.added} code(s). ${res.deliveredToQueue} delivered straight to waiting requests.`);
      setCodes("");
      setTx("");
      onChanged();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const input = "h-9 rounded-full border border-line/15 bg-bg/60 px-4 text-xs outline-none focus:border-accent/60";

  return (
    <div className="card p-5">
      <p className="label">Code stock</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] font-mono text-xs">
          <thead>
            <tr className="text-left text-muted">
              <th className="pb-2 font-normal">Region</th>
              {points.platforms.map((p) => (
                <th key={p.id} className="pb-2 text-right font-normal">
                  {platformLabel(p.id)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {points.regions.map((r) => (
              <tr key={r} className="border-t border-line/[0.06]">
                <td className="py-2">{r}</td>
                {points.platforms.map((p) => {
                  const n = stock[stockKey(p.id, r)] ?? 0;
                  return (
                    <td key={p.id} className={`py-2 text-right ${n > 0 ? "text-good" : "text-muted"}`}>
                      {n}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-3">
        <p className="text-sm font-medium">Add codes</p>
        <div className="flex flex-wrap gap-2">
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className={input}>
            {points.platforms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <select value={region} onChange={(e) => setRegion(e.target.value)} className={input}>
            {points.regions.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <input value={tx} onChange={(e) => setTx(e.target.value)} placeholder="Purchase tx signature (treasury payment)" className={`${input} min-w-0 flex-1 font-mono`} required />
        </div>
        <textarea
          value={codes}
          onChange={(e) => setCodes(e.target.value)}
          placeholder={"One code per line\nXXXX-XXXX-XXXX\nXXXX-XXXX-XXXX"}
          rows={4}
          spellCheck={false}
          autoComplete="off"
          className="w-full rounded-xl border border-line/15 bg-bg/60 p-3 font-mono text-xs outline-none focus:border-accent/60"
          required
        />
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn-primary !py-2 text-xs" disabled={busy || count === 0 || !tx.trim()}>
            {busy ? "Encrypting…" : `Add ${count || ""} code${count === 1 ? "" : "s"}`}
          </button>
          {msg && <span className="text-xs text-muted">{msg}</span>}
        </div>
        <p className="text-[11px] text-muted">
          Codes are encrypted before they&apos;re saved and are never shown here again. Waiting requests for this platform
          and region get them first, oldest first.
        </p>
      </form>
    </div>
  );
}
