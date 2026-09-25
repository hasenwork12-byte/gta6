import { NextRequest, NextResponse } from "next/server";
import { hasBearer } from "@/lib/auth";
import { runSnapshot } from "@/lib/points";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Vercel Cron calls this daily (see vercel.json) with `Authorization: Bearer $CRON_SECRET`.
// It can also be triggered manually with the ADMIN_TOKEN.
export async function GET(req: NextRequest) {
  if (!hasBearer(req.headers.get("authorization"), process.env.CRON_SECRET, process.env.ADMIN_TOKEN)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await runSnapshot();
    console.log("points snapshot", result);
    return NextResponse.json(result);
  } catch (e) {
    console.error("points snapshot failed", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Snapshot failed" }, { status: 500 });
  }
}
