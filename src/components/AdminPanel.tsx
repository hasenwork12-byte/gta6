"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { platformLabel, site } from "@/config";
import { fmtDateTime, shortAddr } from "@/lib/format";
import type { Redemption } from "@/lib/types";

const KEY = "six-palms-admin-token";

export default function AdminPanel() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [rows, setRows] = useState<Redemption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [txInput, setTxInput] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const api = useCallback(
    async (init?: RequestInit, t = token) => {
      const r = await fetch("/api/admin/redemptions", {
        ...init,
        headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
        cache: "no-store",
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Request failed");
      return j;
    },
    [token],
  );

  const refresh = useCallback(
    async (t = token) => {
      try {
        const j = await api(undefined, t);
        setRows(j.redemptions);
        setAuthed(true);
        setError(null);
        try {
          sessionStorage.setItem(KEY, t);
        } catch {}
      } catch (e) {
        setAuthed(false);
        setError(e instanceof Error ? e.message : "Failed");
      }
    },
    [api, token],
  );

  useEffect(() => {
    try {
      const t = sessionStorage.getItem(KEY);
      if (t) {
        setToken(t);
        refresh(t);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const act = async (id: string, action: "fulfill" | "reject") => {
    if (action === "reject" && !confirm("Reject and refund the points?")) return;
    try {
      await api({ method: "POST", body: JSON.stringify({ id, action, tx: txInput[id] ?? "" }) });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  };

  if (!authed) {
    const onSubmit = (e: FormEvent) => {
      e.preventDefault();
      refresh(token);
    };
    return (
      <form onSubmit={onSubmit} className="card flex max-w-lg flex-col gap-3 p-5 sm:flex-row">
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="ADMIN_TOKEN"
          className="h-[42px] min-w-0 flex-1 rounded-full border border-line/15 bg-bg/60 px-5 font-mono text-sm outline-none focus:border-accent/60"
        />
        <button className="btn-primary">Unlock</button>
        {error && <p className="text-sm text-accent sm:hidden">{error}</p>}
        {error && <p className="hidden text-sm text-accent sm:block sm:self-center">{error}</p>}
      </form>
    );
  }

  const shown = filter === "pending" ? rows.filter((r) => r.status === "pending") : rows;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {(["pending", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={filter === f ? "btn-primary !py-1.5 text-xs" : "btn-ghost !py-1.5 text-xs"}>
            {f === "pending" ? `Pending (${rows.filter((r) => r.status === "pending").length})` : `All (${rows.length})`}
          </button>
        ))}
        <button onClick={() => refresh()} className="btn-ghost !py-1.5 text-xs">
          Refresh
        </button>
        {error && <span className="text-sm text-accent">{error}</span>}
      </div>

      {shown.length === 0 ? (
        <div className="card p-10 text-center text-sm text-muted">Nothing here.</div>
      ) : (
        <ul className="space-y-3">
          {shown.map((r) => (
            <li key={r.id} className="card p-4 text-sm sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono">
                  #{r.id} · <a className="link" href={site.explorerAccount(r.wallet)} target="_blank" rel="noreferrer">{shortAddr(r.wallet, 6)}</a>
                  {r.demo && <span className="ml-2 text-amber-300">demo</span>}
                </span>
                <span className="font-mono text-xs text-muted">{fmtDateTime(r.createdAt / 1000)}</span>
              </div>
              <div className="mt-2 grid gap-1 text-muted sm:grid-cols-4">
                <span>
                  <span className="text-fg">{platformLabel(r.platform)}</span>
                </span>
                <span>{r.region}</span>
                <span className="break-all text-fg">{r.email || "—"}</span>
                <span className="capitalize">{r.status}</span>
              </div>
              {r.tx && (
                <a className="link mt-2 inline-block font-mono text-xs" href={site.explorerTx(r.tx)} target="_blank" rel="noreferrer">
                  Receipt {shortAddr(r.tx, 6)} ↗
                </a>
              )}
              {r.status === "pending" && (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    value={txInput[r.id] ?? ""}
                    onChange={(e) => setTxInput((s) => ({ ...s, [r.id]: e.target.value }))}
                    placeholder="Purchase tx signature"
                    className="h-9 min-w-0 flex-1 rounded-full border border-line/15 bg-bg/60 px-4 font-mono text-xs outline-none focus:border-accent/60"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => act(r.id, "fulfill")} className="btn-primary !py-1.5 text-xs">
                      Mark fulfilled
                    </button>
                    <button onClick={() => act(r.id, "reject")} className="btn-ghost !py-1.5 text-xs">
                      Reject + refund
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
