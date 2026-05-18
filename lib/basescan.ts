const BASE_URL = "https://base.blockscout.com/api";
const PAGE_LIMIT = "1000";
const REQUEST_TIMEOUT_MS = 12_000;

type ApiResponse<T> = { status: string; message: string; result: T };

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

async function call<T>(params: Record<string, string>, fallback: T): Promise<T> {
  const url = new URL(BASE_URL);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), { cache: "no-store", signal: ctrl.signal });
    if (!res.ok) return fallback;
    const json = (await res.json()) as ApiResponse<T>;
    if (json.status !== "1") {
      if (typeof json.result === "string" && /No transactions/i.test(json.result)) {
        return fallback;
      }
      if (json.message === "No transactions found") return fallback;
    }
    return json.result ?? fallback;
  } catch {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}

export async function getNormalTxs(address: string): Promise<NormalTx[]> {
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
    []
  );
}

export async function getInternalTxs(address: string): Promise<NormalTx[]> {
  return call<NormalTx[]>(
    {
      module: "account",
      action: "txlistinternal",
      address,
      startblock: "0",
      endblock: "99999999",
      sort: "desc",
      page: "1",
      offset: PAGE_LIMIT,
    },
    []
  );
}

export async function getTokenTxs(address: string): Promise<TokenTx[]> {
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
    []
  );
}

export async function getEthBalance(address: string): Promise<number> {
  const wei = await call<string>(
    { module: "account", action: "balance", address, tag: "latest" },
    "0"
  );
  try {
    return Number(BigInt(wei)) / 1e18;
  } catch {
    return 0;
  }
}
