import { NextRequest, NextResponse } from "next/server";

// Explorer proxy. The browser used to call base.blockscout.com directly, so
// every visitor spent their own IP's anonymous rate limit and got
// "Too many requests" after a few lookups. Here the call is made server-side
// with an API key, and the CDN caches the answer, so the whole site shares one
// generous quota instead of each visitor sharing none.

// Etherscan's multichain V2 endpoint covers Base (chain id 8453) and takes the
// same module/action parameters as Blockscout, so the response shape the client
// parses is unchanged. It is the fallback only — Blockscout is the source the
// scoring criteria were built and calibrated against.
const ETHERSCAN_V2 = "https://api.etherscan.io/v2/api";
const BASE_CHAIN_ID = "8453";
// Public instance: no key, throttled per IP.
const BLOCKSCOUT = "https://base.blockscout.com/api";
// Keyed instance: a different host entirely — an apikey on base.blockscout.com
// is ignored. This is where the free dev.blockscout.com key raises the limit to
// 5 req/s and 100k credits/day.
const BLOCKSCOUT_PRO = "https://api.blockscout.com/v2/api";

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

const UPSTREAM_TIMEOUT_MS = 5_000;
// Blockscout answers roughly one request in three right now — the rest come
// back as HTTP 500 with no pattern. Retrying the same upstream a couple of
// times turns that into a usable success rate and keeps traffic off the paid
// fallback. Only 5xx and timeouts are retried; a 429 means the window is spent.
const UPSTREAM_ATTEMPTS = 3;
const RETRY_DELAY_MS = 400;
// Hard ceiling for the whole route. The browser gives up on this request after
// 10s and moves to its own fallback, so answering later than this is worse than
// answering "unavailable" now: it just delays the working path.
const TOTAL_BUDGET_MS = 7_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchUpstream(url: string, timeoutMs: number): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
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
  // Anonymous Blockscout requests are throttled hard, and the refusal comes
  // back disguised as a server error ("Something went wrong.", HTTP 500) rather
  // than a clean 429. The free dev.blockscout.com key avoids that, but only on
  // the keyed host below.
  const blockscoutKey = process.env.BLOCKSCOUT_API_KEY?.trim();

  const blockscoutProUrl = new URL(BLOCKSCOUT_PRO);
  blockscoutProUrl.searchParams.set("chain_id", BASE_CHAIN_ID);
  for (const name of FORWARDED_PARAMS) {
    const value = params.get(name);
    if (value !== null) blockscoutProUrl.searchParams.set(name, value);
  }
  if (blockscoutKey) blockscoutProUrl.searchParams.set("apikey", blockscoutKey);

  // Blockscout stays the source of truth — the scoring was calibrated on it.
  // Keyed host first when a key exists, then the public instance, and Etherscan
  // only as a last resort (its free tier does not even cover Base).
  const targets: { url: string; name: string }[] = [
    ...(blockscoutKey
      ? [{ url: blockscoutProUrl.toString(), name: "blockscout-pro" }]
      : []),
    { url: blockscoutUrl.toString(), name: "blockscout-public" },
    ...(key ? [{ url: etherscanUrl.toString(), name: "etherscan" }] : []),
  ];

  let lastStatus = 502;
  let lastBody: unknown = null;
  // One line per upstream attempt, surfaced as a response header so a failure
  // can be diagnosed from outside without leaking the key.
  const tried: string[] = [];

  const startedAt = Date.now();
  // Time left in the budget. Each attempt gets at most this, so a slow upstream
  // can never push the whole route past the browser's own 10s cutoff.
  const remaining = () => TOTAL_BUDGET_MS - (Date.now() - startedAt);
  let budgetSpent = false;

  for (const { url: target, name: upstream } of targets) {
    if (budgetSpent) break;
    for (let attempt = 0; attempt < UPSTREAM_ATTEMPTS; attempt++) {
      if (attempt > 0) await sleep(RETRY_DELAY_MS * attempt);
      const attemptMs = Math.min(UPSTREAM_TIMEOUT_MS, remaining());
      if (attemptMs < 1_000) {
        tried.push("budget-exhausted");
        budgetSpent = true;
        break;
      }
      try {
      const res = await fetchUpstream(target, attemptMs);
      lastStatus = res.status;
      if (!res.ok) {
        tried.push(`${upstream}:${res.status}`);
        // 5xx is the flaky-Blockscout case and worth another shot; 4xx (429,
        // 402, 400) will answer the same way until the window or plan changes.
        if (res.status >= 500 && attempt < UPSTREAM_ATTEMPTS - 1) continue;
        break;
      }

      const json = await res.json();
      lastBody = json;

      // A throttled upstream answers with HTTP 200 and status "0". Blockscout
      // puts the reason in `message` with a null result ("Too many requests…"),
      // Etherscan puts it in `result` — check both, or the refusal gets passed
      // to the client as if it were data. An empty-but-valid answer
      // ("No transactions found") must still pass through untouched.
      const body = json as {
        status?: string;
        message?: string;
        result?: unknown;
      };
      const reason = [
        typeof body.result === "string" ? body.result : "",
        body.message ?? "",
      ].join(" ");
      const refused =
        body.status !== "1" &&
        /rate limit|too many requests|max calls|invalid api key/i.test(reason);
      if (refused) {
        tried.push(`${upstream}:refused`);
        break;
      }

      return NextResponse.json(json, {
        headers: {
          // A wallet's history barely changes minute to minute; caching at the
          // CDN keeps repeat lookups off the upstream quota entirely.
          "Cache-Control":
            "public, s-maxage=300, stale-while-revalidate=1800",
          // Which upstream actually answered — makes it possible to tell from
          // outside whether the key is in play, without exposing the key.
          "x-scan-upstream": upstream,
          "x-scan-tried": [...tried, `${upstream}:ok`].join(","),
        },
      });
      } catch {
        // Timeout or network error — retry, then move to the next upstream.
        lastStatus = 504;
        tried.push(`${upstream}:timeout`);
      }
    }
  }

  return NextResponse.json(
    lastBody ?? {
      status: "0",
      message: "Explorer unavailable",
      result: null,
    },
    {
      status: lastStatus >= 400 ? lastStatus : 502,
      headers: { "x-scan-tried": tried.join(",") || "none" },
    }
  );
}
