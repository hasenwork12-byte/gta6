import { NextRequest, NextResponse } from "next/server";
import { hasBearer } from "@/lib/auth";
import { addStock, assignTeamCode, getStockCounts, listRedemptions, resolveRedemption } from "@/lib/points";

export const dynamic = "force-dynamic";

function authorized(req: NextRequest) {
  return hasBearer(req.headers.get("authorization"), process.env.ADMIN_TOKEN);
}

export async function GET(req: NextRequest) {
  if (!process.env.ADMIN_TOKEN) return NextResponse.json({ error: "Set ADMIN_TOKEN (16+ chars) to enable admin." }, { status: 503 });
  if (!authorized(req)) return NextResponse.json({ error: "Wrong admin token." }, { status: 401 });
  const [redemptions, stock] = await Promise.all([listRedemptions(), getStockCounts()]);
  return NextResponse.json({ redemptions, stock }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Wrong admin token." }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const s = (k: string) => (typeof body[k] === "string" ? (body[k] as string) : "");
  const action = s("action");

  try {
    if (action === "addStock") {
      const codes = s("codes").split(/\r?\n/);
      const res = await addStock(s("platform"), s("region"), codes, s("tx"));
      return NextResponse.json(res);
    }
    if (action === "assignTeam") {
      const code = await assignTeamCode(s("id"), s("platform"), s("region"));
      return NextResponse.json({ code }, { headers: { "Cache-Control": "no-store" } });
    }
    if (action === "fulfill" || action === "reject") {
      const id = s("id");
      if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
      if (action === "fulfill" && !s("tx").trim()) {
        return NextResponse.json({ error: "Add the purchase transaction signature so the receipt is verifiable." }, { status: 400 });
      }
      const updated = await resolveRedemption(id, action, s("tx").trim() || null, s("note").trim() || null);
      if (!updated) return NextResponse.json({ error: "Not found." }, { status: 404 });
      return NextResponse.json({ redemption: updated });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
