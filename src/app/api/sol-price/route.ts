import { NextResponse } from "next/server";
import { getSolPrice } from "@/lib/solana";

export const dynamic = "force-dynamic";

export async function GET() {
  const p = await getSolPrice();
  if (!(p.usd > 0)) return NextResponse.json({ error: "SOL price unavailable" }, { status: 502 });
  return NextResponse.json(p, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
