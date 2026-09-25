import { NextRequest, NextResponse } from "next/server";
import { claimGift } from "@/lib/points";
import { isValidAddress } from "@/lib/solana";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const str = (k: string) => (typeof body[k] === "string" ? (body[k] as string).trim() : "");
  const wallet = str("wallet");
  if (!isValidAddress(wallet)) return NextResponse.json({ error: "Invalid wallet." }, { status: 400 });

  try {
    const res = await claimGift({
      id: str("id"),
      wallet,
      platform: str("platform"),
      region: str("region"),
      email: str("email"),
      issuedAt: str("issuedAt"),
      signature: str("signature"),
    });
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status });
    return NextResponse.json({ id: res.id });
  } catch (e) {
    console.error("claim failed", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
