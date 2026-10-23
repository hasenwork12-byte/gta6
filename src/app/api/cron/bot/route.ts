import { NextRequest, NextResponse } from "next/server";
import { hasBearer } from "@/lib/auth";
import { runBotWatching } from "@/lib/bot";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Runs the fee bot: claim creator fees → buy back → burn → send the rest to the Pig Bank,
// then watches the fee vaults for ~25s and claims again the moment one is due.
// Call it EVERY MINUTE with `Authorization: Bearer $CRON_SECRET` (cron-job.org; Vercel's
// own cron is daily on Hobby), or with the ADMIN_TOKEN.
export async function GET(req: NextRequest) {
  if (!hasBearer(req.headers.get("authorization"), process.env.CRON_SECRET, process.env.ADMIN_TOKEN)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const runs = await runBotWatching();
  for (const r of runs) console.log("fee bot", JSON.stringify(r.run ?? r));
  return NextResponse.json({ runs }, { status: runs.some((r) => r.run?.error) ? 500 : 200 });
}
