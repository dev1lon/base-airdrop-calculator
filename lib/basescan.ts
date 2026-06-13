const BASE_URL = "https://base.blockscout.com/api";
const PAGE_LIMIT = "1000";
// tokentx rows carry the parent tx's full `input` calldata (unused here but up
// to tens of KB each — a busy wallet's 1000-row page can hit 30+ MB and >10 s,
// which the client browser must download and parse). A smaller page keeps the
// payload light and fast; tx/contract counts come from txlist, so tokens only
// need a recent sample for stablecoin value and ERC-20 bridge detection.
const TOKEN_PAGE_LIMIT = "200";
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS = 4;

type ApiResponse<T> = { status: string; message: string; result: T };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

class ApiUnavailableError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiUnavailableError";
    this.status = status;
  }
}

// A successful-but-empty lookup. Blockscout/etherscan signals "this address
// simply has no data of this kind" with status "0" and EITHER an empty array
// result OR a "No <something> found" message — e.g. "No transactions found"
// (txlist), "No token transfers found" (tokentx), "No internal transactions
// found" (txlistinternal). Genuine failures (rate limit, bad address) instead
// return a *string* result like "Max rate limit reached" / "Invalid address".
// Matching only "No transactions" wrongly treated empty token/internal lists as
// errors, failing the whole check for any wallet with no token transfers.
function isEmptyResult(json: ApiResponse<unknown>): boolean {
  if (Array.isArray(json.result) && json.result.length === 0) return true;
  if (/^\s*No\b.*\bfound\b/i.test(json.message)) return true;
  if (typeof json.result === "string" && /^\s*No\b.*\bfound\b/i.test(json.result))
    return true;
  return false;
}

function responseSummary(json: ApiResponse<unknown>): string {
  const result =
    typeof json.result === "string"
      ? json.result.slice(0, 120)
      : JSON.stringify(json.result)?.slice(0, 120);
  return `status=${json.status} message=${json.message} result=${result}`;
}

export type NormalTx = {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  isError: string;
  txreceipt_status: string;
  contractAddress: string;
  input: string;
  methodId?: string;
  functionName?: string;
};

export type TokenTx = {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  contractAddress: string;
  tokenSymbol: string;
  tokenDecimal: string;
};

// One HTTP attempt. Returns the parsed result, an empty-sentinel for a clean
// "no transactions" response, or throws ApiUnavailableError on any transport
// failure (non-200 incl. 429, timeout, network, bad JSON) so the caller can
// retry instead of mistaking a failed request for an inactive wallet.
async function attempt<T>(url: string, fallback: T): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { cache: "no-store", signal: ctrl.signal });
    if (!res.ok) throw new ApiUnavailableError(`HTTP ${res.status}`, res.status);
    const json = (await res.json()) as ApiResponse<T>;

    if (json.status !== "1") {
      if (isEmptyResult(json)) return fallback;
      throw new ApiUnavailableError(responseSummary(json));
    }

    const result = json.result ?? fallback;
    if (Array.isArray(fallback) && !Array.isArray(result)) {
      throw new ApiUnavailableError(responseSummary(json));
    }
    if (typeof fallback === "string" && typeof result !== "string") {
      throw new ApiUnavailableError(responseSummary(json));
    }

    return result;
  } finally {
    clearTimeout(timer);
  }
}

// Retries transient failures with backoff. When all attempts fail:
//   - critical call  -> throw (the whole check fails loudly -> "try again")
//   - non-critical    -> return fallback (degrade gracefully)
async function call<T>(
  params: Record<string, string>,
  fallback: T,
  critical = false
): Promise<T> {
  const url = new URL(BASE_URL);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const target = url.toString();

  let lastErr: unknown;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    try {
      return await attempt<T>(target, fallback);
    } catch (e) {
      lastErr = e;
      // 429 = IP rate-limited; the window won't reset within a retry backoff,
      // and retrying only burns more of the exhausted quota. Fail fast.
      if (e instanceof ApiUnavailableError && e.status === 429) break;
      if (i < MAX_ATTEMPTS - 1) await sleep(300 * (i + 1) + Math.floor(Math.random() * 200));
    }
  }
  if (critical) {
    const action = params.action || "unknown";
    const reason = lastErr instanceof Error ? lastErr.message : String(lastErr);
    throw new ApiUnavailableError(`Blockscout ${action} failed after ${MAX_ATTEMPTS} attempts: ${reason}`);
  }
  return fallback;
}

export async function getNormalTxs(address: string): Promise<NormalTx[]> {
  // Critical: txCount / months / value all derive from this. A failed request
  // must not be mistaken for an empty wallet, so propagate the error.
  return call<NormalTx[]>(
    {
      module: "account",
      action: "txlist",
      address,
      startblock: "0",
      endblock: "99999999",
      sort: "desc",
      page: "1",
      offset: PAGE_LIMIT,
    },
    [],
    true
  );
}

export async function getInternalTxs(
  address: string,
  sort: "asc" | "desc" = "desc"
): Promise<NormalTx[]> {
  // Critical for bridge detection and the 48h activity window.
  return call<NormalTx[]>(
    {
      module: "account",
      action: "txlistinternal",
      address,
      startblock: "0",
      endblock: "99999999",
      sort,
      page: "1",
      offset: PAGE_LIMIT,
    },
    [],
    true
  );
}

export async function getTokenTxs(address: string): Promise<TokenTx[]> {
  // Critical for token bridge/value criteria. A rate-limit string must not
  // become "no token activity".
  return call<TokenTx[]>(
    {
      module: "account",
      action: "tokentx",
      address,
      startblock: "0",
      endblock: "99999999",
      sort: "desc",
      page: "1",
      offset: TOKEN_PAGE_LIMIT,
    },
    [],
    true
  );
}

export async function getEthBalance(address: string): Promise<number> {
  const wei = await call<string>(
    { module: "account", action: "balance", address, tag: "latest" },
    "0",
    true
  );
  try {
    return Number(BigInt(wei)) / 1e18;
  } catch {
    throw new ApiUnavailableError(`Invalid balance result: ${wei}`);
  }
}
