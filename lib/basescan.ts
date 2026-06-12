const BASE_URL = "https://base.blockscout.com/api";
const PAGE_LIMIT = "1000";
const REQUEST_TIMEOUT_MS = 9_000;
const MAX_ATTEMPTS = 4;

type ApiResponse<T> = { status: string; message: string; result: T };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

class ApiUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiUnavailableError";
  }
}

function isNoTransactions(json: ApiResponse<unknown>): boolean {
  return (
    (typeof json.result === "string" && /No transactions/i.test(json.result)) ||
    /No transactions/i.test(json.message)
  );
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
    if (!res.ok) throw new ApiUnavailableError(`HTTP ${res.status}`);
    const json = (await res.json()) as ApiResponse<T>;

    if (json.status !== "1") {
      if (isNoTransactions(json)) return fallback;
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
      offset: PAGE_LIMIT,
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
