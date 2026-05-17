import { NextResponse } from "next/server";
import {
  ARB_AIRDROP_PCT,
  DEFAULT_AIRDROP_PCT,
  DEFAULT_FDV,
  TOTAL_SUPPLY,
} from "@/lib/scoring";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    totalSupply: TOTAL_SUPPLY,
    arbAirdropPct: ARB_AIRDROP_PCT,
    defaultFdv: DEFAULT_FDV,
    defaultAirdropPct: DEFAULT_AIRDROP_PCT,
  });
}
