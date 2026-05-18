import { getEthBalance, getInternalTxs, getNormalTxs, getTokenTxs } from "./basescan";
import { lookupBaseName } from "./basenames";
import { getPrices, tokenUsdValue } from "./pricing";
import type { ActivityStats } from "./types";

const FORTY_EIGHT_HOURS_S = 48 * 60 * 60;
const L2_STANDARD_BRIDGE = "0x4200000000000000000000000000000000000010";

function isContract(input: string): boolean {
  return Boolean(input) && input !== "0x" && input.length > 2;
}

function safeBigInt(s: string | undefined | null): bigint {
  if (!s) return 0n;
  try {
    return BigInt(s);
  } catch {
    return 0n;
  }
}

function weiToEth(wei: bigint): number {
  return Number(wei) / 1e18;
}

export async function analyzeAddress(address: string): Promise<ActivityStats> {
  const lower = address.toLowerCase();

  const [normal, internal, tokens, balance, prices, name] = await Promise.all([
    getNormalTxs(address),
    getInternalTxs(address),
    getTokenTxs(address),
    getEthBalance(address),
    getPrices(),
    lookupBaseName(address),
  ]);
  const ethPrice = prices.eth;

  const months = new Set<string>();
  const contracts = new Set<string>();
  let minTs = Number.POSITIVE_INFINITY;
  let maxTs = Number.NEGATIVE_INFINITY;
  let tsCount = 0;
  let aggValueUsd = 0;
  let bridgedUsd = 0;
  let hasBridged = false;
  let txCount = 0;

  function recordTs(ts: number) {
    if (!ts) return;
    if (ts < minTs) minTs = ts;
    if (ts > maxTs) maxTs = ts;
    tsCount++;
  }

  for (const tx of normal) {
    const ts = Number(tx.timeStamp);
    if (!ts) continue;
    recordTs(ts);
    const d = new Date(ts * 1000);
    months.add(`${d.getUTCFullYear()}-${d.getUTCMonth()}`);

    if (tx.from?.toLowerCase() === lower) {
      txCount++;
      if (tx.to && isContract(tx.input)) {
        contracts.add(tx.to.toLowerCase());
      }
      aggValueUsd += weiToEth(safeBigInt(tx.value)) * ethPrice;
    }
  }

  for (const tx of internal) {
    const ts = Number(tx.timeStamp);
    if (ts) recordTs(ts);
    if (
      tx.from?.toLowerCase() === L2_STANDARD_BRIDGE &&
      tx.to?.toLowerCase() === lower
    ) {
      hasBridged = true;
      bridgedUsd += weiToEth(safeBigInt(tx.value)) * ethPrice;
    }
  }

  for (const t of tokens) {
    const ts = Number(t.timeStamp);
    if (ts) {
      recordTs(ts);
      const d = new Date(ts * 1000);
      months.add(`${d.getUTCFullYear()}-${d.getUTCMonth()}`);
    }
    const decimals = Number(t.tokenDecimal || "18");
    const amount = safeBigInt(t.value);
    if (t.from?.toLowerCase() === lower) {
      aggValueUsd += tokenUsdValue(t.contractAddress, amount, decimals, prices);
    }
    if (
      t.from?.toLowerCase() === L2_STANDARD_BRIDGE &&
      t.to?.toLowerCase() === lower
    ) {
      hasBridged = true;
      bridgedUsd += tokenUsdValue(t.contractAddress, amount, decimals, prices);
    }
  }

  const allInside48h = tsCount > 1 && maxTs - minTs <= FORTY_EIGHT_HOURS_S;

  return {
    address,
    txCount,
    contractCount: contracts.size,
    monthsActive: months.size,
    aggValueUsd,
    bridgedUsd,
    hasBridged,
    hasBaseName: Boolean(name),
    baseName: name,
    ethBalance: balance,
    allInside48h,
    ethPriceUsd: ethPrice,
  };
}
