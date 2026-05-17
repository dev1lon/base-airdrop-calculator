import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { analyzeAddress } from "@/lib/analyze";
import { resolveBaseName } from "@/lib/basenames";
import { score } from "@/lib/scoring";
import type { CheckResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<NextResponse<CheckResponse>> {
  const { searchParams } = new URL(req.url);
  const raw = (searchParams.get("address") || "").trim();
  if (!raw) {
    return NextResponse.json({ ok: false, error: "Missing address" }, { status: 400 });
  }

  let address = raw;
  if (!isAddress(address)) {
    if (/\.base(\.eth)?$/i.test(address)) {
      const name = address.endsWith(".eth") ? address : `${address}.eth`;
      const resolved = await resolveBaseName(name);
      if (!resolved) {
        return NextResponse.json(
          { ok: false, error: "Could not resolve Base Name" },
          { status: 400 }
        );
      }
      address = resolved;
    } else {
      return NextResponse.json(
        { ok: false, error: "Invalid address or Base Name" },
        { status: 400 }
      );
    }
  }

  try {
    const stats = await analyzeAddress(address);
    const sc = score(stats);
    return NextResponse.json({ ok: true, address, stats, score: sc });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
