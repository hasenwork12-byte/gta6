import { NextRequest, NextResponse } from "next/server";
import { hasBearer } from "@/lib/auth";
import { runBot } from "@/lib/bot";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Runs the fee bot: claim creator fees → buy back → burn → send the rest to the Pig Bank.
// Call it with `Authorization: Bearer $CRON_SECRET` (Vercel Cron does this by itself;
// an outside scheduler such as cron-job.org can call it every few minutes), or the ADMIN_TOKEN.
export async function GET(req: NextRequest) {
  if (!hasBearer(req.headers.get("authorization"), process.env.CRON_SECRET, process.env.ADMIN_TOKEN)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runBot();
  console.log("fee bot", JSON.stringify(result.run ?? result));
  return NextResponse.json(result, { status: result.run?.error ? 500 : 200 });
}
