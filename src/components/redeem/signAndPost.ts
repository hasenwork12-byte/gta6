"use client";

function toBase64(bytes: Uint8Array) {
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
}

/** Signs `message` with the wallet and POSTs it with `body`. Returns the JSON or throws a friendly error. */
export async function signAndPost(
  signMessage: ((m: Uint8Array) => Promise<Uint8Array>) | undefined,
  url: string,
  message: string,
  body: Record<string, unknown>,
) {
  if (!signMessage) throw new Error("Your wallet doesn't support message signing. Try Phantom, Solflare or Backpack.");
  let sig: Uint8Array;
  try {
    sig = await signMessage(new TextEncoder().encode(message));
  } catch {
    throw new Error("Signature cancelled — nothing was spent.");
  }
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, signature: toBase64(sig) }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error ?? "Something went wrong");
  return j as { id: string };
}
