export const shortAddr = (a: string, n = 4) =>
  a.length <= n * 2 + 1 ? a : `${a.slice(0, n)}…${a.slice(-n)}`;

export const fmtNum = (v: number, digits = 0) =>
  v.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const fmtUsd = (v: number, digits = 2) =>
  "$" + fmtNum(v, digits);

export const fmtDate = (iso: string | number) => {
  const d = typeof iso === "number" ? new Date(iso * 1000) : new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
};

/** Compact relative time ("now", "5m", "2h", "3d"), measured from `nowMs` so server and client agree. */
export const timeAgo = (ms: number, nowMs: number) => {
  const s = Math.max(0, Math.floor((nowMs - ms) / 1000));
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 60 * 86400) return `${Math.floor(s / 86400)}d`;
  return fmtDate(ms / 1000);
};

export const fmtDateTime = (unix: number) =>
  new Date(unix * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }) + " UTC";
