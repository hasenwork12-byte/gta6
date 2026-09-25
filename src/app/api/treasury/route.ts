import { NextResponse } from "next/server";
import { getDashboard } from "@/lib/solana";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getDashboard(), {
      headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=120" },
    });
  } catch (e) {
    console.error("treasury snapshot failed", e);
    return NextResponse.json({ error: "RPC unavailable" }, { status: 502 });
  }
}
