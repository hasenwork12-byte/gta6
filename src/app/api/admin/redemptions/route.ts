import { NextRequest, NextResponse } from "next/server";
import { hasBearer } from "@/lib/auth";
import { listRedemptions, resolveRedemption } from "@/lib/points";

export const dynamic = "force-dynamic";

function authorized(req: NextRequest) {
  return hasBearer(req.headers.get("authorization"), process.env.ADMIN_TOKEN);
}

export async function GET(req: NextRequest) {
  if (!process.env.ADMIN_TOKEN) return NextResponse.json({ error: "Set ADMIN_TOKEN (16+ chars) to enable admin." }, { status: 503 });
  if (!authorized(req)) return NextResponse.json({ error: "Wrong admin token." }, { status: 401 });
  return NextResponse.json({ redemptions: await listRedemptions() });
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Wrong admin token." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { id, action, tx, note } = body as { id?: string; action?: string; tx?: string; note?: string };
  if (!id || (action !== "fulfill" && action !== "reject")) {
    return NextResponse.json({ error: "Need id and action (fulfill | reject)." }, { status: 400 });
  }
  if (action === "fulfill" && !tx?.trim()) {
    return NextResponse.json({ error: "Add the purchase transaction signature so the receipt is verifiable." }, { status: 400 });
  }
  const updated = await resolveRedemption(id, action, tx?.trim() || null, note?.trim() || null);
  if (!updated) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ redemption: updated });
}
