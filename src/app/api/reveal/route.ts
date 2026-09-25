import { NextRequest, NextResponse } from "next/server";
import { revealCode } from "@/lib/points";
import { isValidAddress } from "@/lib/solana";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const str = (k: string) => (typeof body[k] === "string" ? (body[k] as string).trim() : "");
  const wallet = str("wallet");
  if (!isValidAddress(wallet)) return NextResponse.json({ error: "Invalid wallet." }, { status: 400 });
  try {
    const res = await revealCode({ id: str("id"), wallet, issuedAt: str("issuedAt"), signature: str("signature") });
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status });
    // Never cache a revealed code anywhere.
    return NextResponse.json({ code: res.code }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("reveal failed", e);
    return NextResponse.json({ error: "Couldn't reveal the code right now." }, { status: 500 });
  }
}
