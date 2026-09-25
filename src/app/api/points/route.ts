import { NextRequest, NextResponse } from "next/server";
import { getPointsInfo } from "@/lib/points";
import { isValidAddress } from "@/lib/solana";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const wallet = (req.nextUrl.searchParams.get("wallet") ?? "").trim();
  if (!isValidAddress(wallet)) {
    return NextResponse.json({ error: "That doesn't look like a valid Solana address." }, { status: 400 });
  }
  try {
    return NextResponse.json(await getPointsInfo(wallet));
  } catch (e) {
    console.error("points lookup failed", e);
    return NextResponse.json({ error: "Couldn't load points right now. Try again in a moment." }, { status: 502 });
  }
}
