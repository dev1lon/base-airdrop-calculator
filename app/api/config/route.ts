import { NextResponse } from "next/server";
import {
  DEFAULT_AIRDROP_PCT,
  DEFAULT_FDV,
  DEFAULT_SUPPLY,
} from "@/lib/scoring";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    defaultSupply: DEFAULT_SUPPLY,
    defaultFdv: DEFAULT_FDV,
    defaultAirdropPct: DEFAULT_AIRDROP_PCT,
  });
}
