// Encrypts game codes before they are stored (AES-256-GCM).
// The encryption key lives only in the KEYS_ENCRYPTION_KEY env var — never in the database —
// so a leaked database alone doesn't expose any codes.
//
// Generate one with:
//   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { POINTS_LIVE } from "./store";

const g = globalThis as unknown as { __pigDemoKey?: Buffer };

function key(): Buffer {
  const raw = (process.env.KEYS_ENCRYPTION_KEY ?? "").trim();
  if (raw) {
    const b = Buffer.from(raw, "base64");
    if (b.length !== 32) throw new Error("KEYS_ENCRYPTION_KEY must be 32 random bytes, base64-encoded.");
    return b;
  }
  if (POINTS_LIVE) throw new Error("Set KEYS_ENCRYPTION_KEY before adding codes.");
  // Demo mode only: a throwaway key that lives as long as the server process.
  return (g.__pigDemoKey ??= randomBytes(32));
}

export const VAULT_READY = () => {
  try {
    key();
    return true;
  } catch {
    return false;
  }
};

export function encryptCode(code: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([c.update(code, "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), ct]).toString("base64");
}

export function decryptCode(blob: string): string {
  const b = Buffer.from(blob, "base64");
  const d = createDecipheriv("aes-256-gcm", key(), b.subarray(0, 12));
  d.setAuthTag(b.subarray(12, 28));
  return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString("utf8");
}
