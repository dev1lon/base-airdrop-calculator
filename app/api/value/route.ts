import { NextResponse } from "next/server";
import {
  computeValue,
  DEFAULT_AIRDROP_PCT,
  DEFAULT_FDV,
  DEFAULT_SUPPLY,
} from "@/lib/scoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const baseTokens = Number(searchParams.get("baseTokens") ?? "0");
  const fdv = Number(searchParams.get("fdv") ?? String(DEFAULT_FDV));
  const airdropPct = Number(searchParams.get("airdropPct") ?? String(DEFAULT_AIRDROP_PCT));
  const totalSupply = Number(searchParams.get("totalSupply") ?? String(DEFAULT_SUPPLY));
  const valuation = computeValue(baseTokens, fdv, airdropPct, totalSupply);
  return NextResponse.json({ ok: true, valuation });
}
