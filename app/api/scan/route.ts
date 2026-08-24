import { NextRequest, NextResponse } from "next/server";

// Explorer proxy. The browser used to call base.blockscout.com directly, so
// every visitor spent their own IP's anonymous rate limit and got
// "Too many requests" after a few lookups. Here the call is made server-side
// with an API key, and the CDN caches the answer, so the whole site shares one
// generous quota instead of each visitor sharing none.

// Etherscan's multichain V2 endpoint covers Base (chain id 8453) and takes the
// same module/action parameters as the Blockscout endpoint we used before, so
// the response shape the client parses is unchanged.
const ETHERSCAN_V2 = "https://api.etherscan.io/v2/api";
const BASE_CHAIN_ID = "8453";
const BLOCKSCOUT = "https://base.blockscout.com/api";

// Only the calls lib/basescan.ts actually makes. Without an allowlist this
// route would be an open proxy that anyone could point at any address or
// action and burn our key with.
const ALLOWED_ACTIONS = new Set([
  "txlist",
  "txlistinternal",
  "tokentx",
  "balance",
]);

const FORWARDED_PARAMS = [
  "module",
  "action",
  "address",
  "startblock",
  "endblock",
  "sort",
  "page",
  "offset",
  "tag",
];

const UPSTREAM_TIMEOUT_MS = 20_000;

async function fetchUpstream(url: string): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    return await fetch(url, { cache: "no-store", signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const action = params.get("action") ?? "";
  const address = params.get("address") ?? "";

  if (params.get("module") !== "account" || !ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json(
      { status: "0", message: "Unsupported request", result: null },
      { status: 400 }
    );
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json(
      { status: "0", message: "Invalid address", result: null },
      { status: 400 }
    );
  }

  const key = process.env.BASESCAN_API_KEY?.trim();

  const etherscanUrl = new URL(ETHERSCAN_V2);
  etherscanUrl.searchParams.set("chainid", BASE_CHAIN_ID);
  for (const name of FORWARDED_PARAMS) {
    const value = params.get(name);
    if (value !== null) etherscanUrl.searchParams.set(name, value);
  }
  if (key) etherscanUrl.searchParams.set("apikey", key);

  const blockscoutUrl = new URL(BLOCKSCOUT);
  for (const name of FORWARDED_PARAMS) {
    const value = params.get(name);
    if (value !== null) blockscoutUrl.searchParams.set(name, value);
  }

  // Etherscan first when we have a key; Blockscout stays as the fallback so a
  // missing key or an Etherscan outage degrades instead of breaking the site.
  const targets = key
    ? [etherscanUrl.toString(), blockscoutUrl.toString()]
    : [blockscoutUrl.toString()];

  let lastStatus = 502;
  let lastBody: unknown = null;

  for (const target of targets) {
    try {
      const res = await fetchUpstream(target);
      lastStatus = res.status;
      if (!res.ok) continue;

      const json = await res.json();
      lastBody = json;

      // status "0" with a rate-limit/error string means this upstream refused;
      // try the next one. An empty-but-valid answer ("No transactions found")
      // is a real result and must pass through untouched.
      const result = (json as { status?: string; result?: unknown }).result;
      const refused =
        (json as { status?: string }).status !== "1" &&
        typeof result === "string" &&
        /rate limit|too many requests|max calls|invalid api key/i.test(result);
      if (refused) continue;

      return NextResponse.json(json, {
        headers: {
          // A wallet's history barely changes minute to minute; caching at the
          // CDN keeps repeat lookups off the upstream quota entirely.
          "Cache-Control":
            "public, s-maxage=300, stale-while-revalidate=1800",
        },
      });
    } catch {
      // Timeout or network error — fall through to the next upstream.
      lastStatus = 504;
    }
  }

  return NextResponse.json(
    lastBody ?? {
      status: "0",
      message: "Explorer unavailable",
      result: null,
    },
    { status: lastStatus >= 400 ? lastStatus : 502 }
  );
}
