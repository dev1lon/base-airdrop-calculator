const BASE_URL = "https://api.etherscan.io/v2/api";
const BASE_CHAIN_ID = "8453";

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
  type?: string;
  txType?: string;
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

async function call<T>(params: Record<string, string>): Promise<T> {
  const key = process.env.ETHERSCAN_API_KEY || process.env.BASESCAN_API_KEY;
  if (!key) throw new Error("ETHERSCAN_API_KEY is not set");
  const url = new URL(BASE_URL);
  url.searchParams.set("chainid", BASE_CHAIN_ID);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("apikey", key);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`Etherscan ${res.status}`);
  const json = (await res.json()) as ApiResponse<T>;
  if (json.status !== "1") {
    if (typeof json.result === "string" && /No transactions/i.test(json.result)) {
      return [] as unknown as T;
    }
    if (json.message === "No transactions found") return [] as unknown as T;
    if (typeof json.result === "string" && /deprecated|V1 endpoint/i.test(json.result)) {
      throw new Error(`Etherscan API: ${json.result}`);
    }
  }
  return json.result;
}

export async function getNormalTxs(address: string): Promise<NormalTx[]> {
  return call<NormalTx[]>({
    module: "account",
    action: "txlist",
    address,
    startblock: "0",
    endblock: "99999999",
    sort: "asc",
    page: "1",
    offset: "10000",
  });
}

export async function getInternalTxs(address: string): Promise<NormalTx[]> {
  return call<NormalTx[]>({
    module: "account",
    action: "txlistinternal",
    address,
    startblock: "0",
    endblock: "99999999",
    sort: "asc",
    page: "1",
    offset: "10000",
  });
}

export async function getTokenTxs(address: string): Promise<TokenTx[]> {
  return call<TokenTx[]>({
    module: "account",
    action: "tokentx",
    address,
    startblock: "0",
    endblock: "99999999",
    sort: "asc",
    page: "1",
    offset: "10000",
  });
}

export async function getEthBalance(address: string): Promise<number> {
  const wei = await call<string>({
    module: "account",
    action: "balance",
    address,
    tag: "latest",
  });
  return Number(BigInt(wei)) / 1e18;
}
