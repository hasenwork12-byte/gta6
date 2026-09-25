"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { platformLabel, points, site } from "@/config";
import AdminStock from "./AdminStock";
import { fmtDateTime, shortAddr } from "@/lib/format";
import type { Redemption } from "@/lib/types";

const KEY = "pig-admin-token";
const KIND_LABEL = { self: "for self", gift: "gift", team: "team donation" } as const;

export default function AdminPanel() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [rows, setRows] = useState<Redemption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [txInput, setTxInput] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [stock, setStock] = useState<Record<string, number>>({});
  const [teamPick, setTeamPick] = useState<Record<string, { platform: string; region: string }>>({});
  const [teamCode, setTeamCode] = useState<Record<string, string>>({});

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
        setStock(j.stock ?? {});
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

  const call = (body: Record<string, unknown>) => api({ method: "POST", body: JSON.stringify(body) });

  const assignTeam = async (id: string) => {
    const pick = teamPick[id] ?? { platform: points.platforms[0].id, region: points.regions[0] };
    try {
      const j = await call({ action: "assignTeam", id, ...pick });
      if (j.code) setTeamCode((s) => ({ ...s, [id]: j.code }));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  };

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

  const isOpen = (r: Redemption) => r.status === "pending" || r.status === "unclaimed";
  const shown = filter === "pending" ? rows.filter(isOpen) : rows;

  return (
    <div className="space-y-4">
      <AdminStock stock={stock} call={call} onChanged={() => refresh()} />
      <div className="flex flex-wrap items-center gap-3 pt-4">
        {(["pending", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={filter === f ? "btn-primary !py-1.5 text-xs" : "btn-ghost !py-1.5 text-xs"}>
            {f === "pending" ? `Open (${rows.filter(isOpen).length})` : `All (${rows.length})`}
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
                  <span className="ml-2 rounded-full border border-line/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted">
                    {KIND_LABEL[r.kind ?? "self"]}
                  </span>
                  {r.demo && <span className="ml-2 text-amber-300">demo</span>}
                </span>
                <span className="font-mono text-xs text-muted">{fmtDateTime(r.createdAt / 1000)}</span>
              </div>
              {r.kind === "gift" && (
                <p className="mt-2 font-mono text-xs text-muted">
                  Recipient:{" "}
                  {r.recipient ? (
                    <a className="link" href={site.explorerAccount(r.recipient)} target="_blank" rel="noreferrer">
                      {shortAddr(r.recipient, 6)}
                    </a>
                  ) : (
                    "—"
                  )}
                </p>
              )}
              <div className="mt-2 grid gap-1 text-muted sm:grid-cols-4">
                <span>
                  <span className="text-fg">
                    {r.platform ? platformLabel(r.platform) : r.kind === "team" ? "Team's choice" : "Not claimed yet"}
                  </span>
                </span>
                <span>{r.region || "—"}</span>
                <span className="break-all text-fg">{r.email || "—"}</span>
                <span className="capitalize">{r.status}</span>
              </div>
              {r.keyId && (
                <p className="mt-2 font-mono text-xs text-good">
                  Code delivered from stock · revealed {r.revealCount ?? 0}×
                </p>
              )}
              {teamCode[r.id] && (
                <div className="mt-3 rounded-lg border border-good/30 bg-good/10 p-3">
                  <p className="text-xs text-muted">Team code (shown once — save it in your password manager):</p>
                  <code className="mt-1 block select-all break-all font-mono text-sm text-good">{teamCode[r.id]}</code>
                </div>
              )}
              {r.kind === "team" && r.status === "pending" && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <select
                    value={teamPick[r.id]?.platform ?? points.platforms[0].id}
                    onChange={(e) =>
                      setTeamPick((s) => ({ ...s, [r.id]: { region: s[r.id]?.region ?? points.regions[0], platform: e.target.value } }))
                    }
                    className="h-9 rounded-full border border-line/15 bg-bg/60 px-3 text-xs"
                  >
                    {points.platforms.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={teamPick[r.id]?.region ?? points.regions[0]}
                    onChange={(e) =>
                      setTeamPick((s) => ({ ...s, [r.id]: { platform: s[r.id]?.platform ?? points.platforms[0].id, region: e.target.value } }))
                    }
                    className="h-9 rounded-full border border-line/15 bg-bg/60 px-3 text-xs"
                  >
                    {points.regions.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                  <button onClick={() => assignTeam(r.id)} className="btn-primary !py-1.5 text-xs">
                    Take code from stock
                  </button>
                </div>
              )}
              {r.status === "unclaimed" && (
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs text-muted">Waiting for the recipient to claim.</span>
                  <button onClick={() => act(r.id, "reject")} className="btn-ghost !py-1.5 text-xs">
                    Cancel gift + refund
                  </button>
                </div>
              )}
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
