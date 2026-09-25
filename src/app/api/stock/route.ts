import { NextResponse } from "next/server";
import { getStockCounts } from "@/lib/points";

export const dynamic = "force-dynamic";

/** Public: how many codes are ready per platform|region (counts only, never codes). */
export async function GET() {
  try {
    return NextResponse.json({ stock: await getStockCounts() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ stock: {} });
  }
}
