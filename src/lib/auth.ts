import { timingSafeEqual } from "crypto";

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Checks `Authorization: Bearer <token>` against any of the given env secrets. */
export function hasBearer(header: string | null, ...secrets: (string | undefined)[]) {
  const got = header?.startsWith("Bearer ") ? header.slice(7) : "";
  return got.length > 0 && secrets.some((s) => s && s.length >= 16 && safeEqual(got, s));
}
