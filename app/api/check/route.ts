import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { analyzeAddress } from "@/lib/analyze";
import { resolveBaseName } from "@/lib/basenames";
import { getClientIp, rateLimit } from "@/lib/ratelimit";
import { score } from "@/lib/scoring";
import type { CheckResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<NextResponse<CheckResponse>> {
  const limit = rateLimit(getClientIp(req.headers));
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many requests, slow down" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } }
    );
  }

  const { searchParams } = new URL(req.url);
  const raw = (searchParams.get("address") || "").trim();
  if (!raw) {
    return NextResponse.json({ ok: false, error: "Missing address" }, { status: 400 });
  }

  let address = raw;
  let resolvedFromName: string | null = null;
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
      resolvedFromName = name;
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
    return NextResponse.json({
      ok: true,
      address,
      resolvedFromName,
      stats,
      score: sc,
    });
  } catch (e) {
    console.error("[/api/check] error:", e);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
