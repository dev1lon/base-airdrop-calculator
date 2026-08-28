import { ANKR_MULTICHAIN_URL } from "./ankr";
import type { NormalTx, TokenTx } from "./basescan";

// Second source for wallet history, used when Blockscout is unavailable —
// which happens more often than rate limits alone would explain: its
// etherscan-compatible endpoint intermittently answers
// {"status":"0","message":"Something went wrong."} and its v2 API can return
// HTTP 500 outright. Ankr's Advanced API is already paid for by this project
// (the canonical-bridge lookup uses it) and carries every field scoring needs.

const PAGE_SIZE = 100;
const MAX_TX_PAGES = 10; // 1000 rows — same depth as the Blockscout page limit
const MAX_TOKEN_PAGES = 2; // 200 rows — same as TOKEN_PAGE_LIMIT
const TIMEOUT_MS = 20_000;

type AnkrTx = {
  blockNumber?: string;
  timestamp?: string;
  from?: string;
  to?: string;
  value?: string;
  gasUsed?: string;
  status?: string;
  input?: string;
  hash?: string;
  contractAddress?: string;
};

type AnkrTransfer = {
  fromAddress?: string;
  toAddress?: string;
  contractAddress?: string;
  valueRawInteger?: string;
  value?: string;
  tokenSymbol?: string;
  tokenDecimals?: number;
  transactionHash?: string;
  blockHeight?: number;
  timestamp?: number;
};

// Ankr returns quantities as hex ("0x2c9dff3"); the rest of the app expects the
// etherscan-style decimal strings.
function hexToDec(value: string | undefined): string {
  if (!value) return "0";
  try {
    return value.startsWith("0x") ? BigInt(value).toString() : String(value);
  } catch {
    return "0";
  }
}

async function rpc<T>(method: string, params: unknown): Promise<T | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(ANKR_MULTICHAIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { result?: T; error?: unknown };
    if (json.error || !json.result) return null;
    return json.result;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function getNormalTxsAnkr(address: string): Promise<NormalTx[]> {
  const out: NormalTx[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < MAX_TX_PAGES; page++) {
    const result = await rpc<{
      transactions?: AnkrTx[];
      nextPageToken?: string;
    }>("ankr_getTransactionsByAddress", {
      blockchain: "base",
      address,
      pageSize: PAGE_SIZE,
      descOrder: true,
      ...(pageToken ? { pageToken } : {}),
    });
    if (!result) {
      // A failure mid-pagination still leaves usable history; only a failure on
      // the very first page means there is nothing to score with.
      if (page === 0) throw new Error("Ankr transactions unavailable");
      break;
    }

    const txs = result.transactions ?? [];
    for (const tx of txs) {
      const failed = tx.status !== undefined && hexToDec(tx.status) === "0";
      out.push({
        blockNumber: hexToDec(tx.blockNumber),
        timeStamp: hexToDec(tx.timestamp),
        hash: tx.hash ?? "",
        from: tx.from ?? "",
        to: tx.to ?? "",
        value: hexToDec(tx.value),
        gasUsed: hexToDec(tx.gasUsed),
        isError: failed ? "1" : "0",
        txreceipt_status: failed ? "0" : "1",
        contractAddress: tx.contractAddress ?? "",
        input: tx.input ?? "0x",
      });
    }

    pageToken = result.nextPageToken;
    if (!pageToken || txs.length === 0) break;
  }

  return out;
}

export async function getTokenTxsAnkr(address: string): Promise<TokenTx[]> {
  const out: TokenTx[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < MAX_TOKEN_PAGES; page++) {
    const result = await rpc<{
      transfers?: AnkrTransfer[];
      nextPageToken?: string;
    }>("ankr_getTokenTransfers", {
      blockchain: "base",
      address,
      pageSize: PAGE_SIZE,
      descOrder: true,
      ...(pageToken ? { pageToken } : {}),
    });
    if (!result) {
      if (page === 0) throw new Error("Ankr token transfers unavailable");
      break;
    }

    const transfers = result.transfers ?? [];
    for (const t of transfers) {
      out.push({
        blockNumber: String(t.blockHeight ?? 0),
        timeStamp: String(t.timestamp ?? 0),
        hash: t.transactionHash ?? "",
        from: t.fromAddress ?? "",
        to: t.toAddress ?? "",
        // valueRawInteger is the raw on-chain amount; `value` is already
        // decimal-adjusted, and using it would apply tokenDecimal twice.
        value: t.valueRawInteger ?? "0",
        contractAddress: t.contractAddress ?? "",
        tokenSymbol: t.tokenSymbol ?? "",
        tokenDecimal: String(t.tokenDecimals ?? 18),
      });
    }

    pageToken = result.nextPageToken;
    if (!pageToken || transfers.length === 0) break;
  }

  return out;
}
