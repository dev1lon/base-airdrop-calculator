import { getEthBalance, getInternalTxs, getNormalTxs, getTokenTxs } from "./basescan";
import { lookupBaseName } from "./basenames";
import { getEthPriceUsd, tokenUsdValue } from "./pricing";
import type { ActivityStats } from "./types";

const FORTY_EIGHT_HOURS_S = 48 * 60 * 60;

function isContract(input: string): boolean {
  return Boolean(input) && input !== "0x" && input.length > 2;
}

function isDepositTx(tx: { type?: string; txType?: string }): boolean {
  const t = (tx.type ?? tx.txType ?? "").toString().toLowerCase();
  return t === "0x7e" || t === "126";
}

export async function analyzeAddress(address: string): Promise<ActivityStats> {
  const lower = address.toLowerCase();

  const [normal, internal, tokens, balance, ethPrice, name] = await Promise.all([
    getNormalTxs(address),
    getInternalTxs(address),
    getTokenTxs(address),
    getEthBalance(address),
    getEthPriceUsd(),
    lookupBaseName(address),
  ]);

  const months = new Set<string>();
  const contracts = new Set<string>();
  const timestamps: number[] = [];
  let aggValueUsd = 0;
  let bridgedUsd = 0;
  let hasBridged = false;

  const outgoing = normal.filter((t) => t.from?.toLowerCase() === lower);
  const txCount = outgoing.length;

  for (const tx of normal) {
    const ts = Number(tx.timeStamp);
    if (!ts) continue;
    timestamps.push(ts);
    const d = new Date(ts * 1000);
    months.add(`${d.getUTCFullYear()}-${d.getUTCMonth()}`);

    if (tx.from?.toLowerCase() === lower) {
      if (tx.to && isContract(tx.input)) {
        contracts.add(tx.to.toLowerCase());
      }
      const ethValue = Number(BigInt(tx.value || "0")) / 1e18;
      aggValueUsd += ethValue * ethPrice;
    }

    if (isDepositTx(tx) && tx.to?.toLowerCase() === lower) {
      hasBridged = true;
      const ethValue = Number(BigInt(tx.value || "0")) / 1e18;
      bridgedUsd += ethValue * ethPrice;
    }
  }

  for (const tx of internal) {
    const ts = Number(tx.timeStamp);
    if (ts) timestamps.push(ts);
  }

  for (const t of tokens) {
    const ts = Number(t.timeStamp);
    if (ts) {
      timestamps.push(ts);
      const d = new Date(ts * 1000);
      months.add(`${d.getUTCFullYear()}-${d.getUTCMonth()}`);
    }
    if (t.from?.toLowerCase() === lower) {
      const decimals = Number(t.tokenDecimal || "18");
      const usd = tokenUsdValue(t.contractAddress, BigInt(t.value || "0"), decimals, ethPrice);
      aggValueUsd += usd;
    }
    if (t.to?.toLowerCase() === lower && hasBridged) {
      const decimals = Number(t.tokenDecimal || "18");
      const usd = tokenUsdValue(t.contractAddress, BigInt(t.value || "0"), decimals, ethPrice);
      bridgedUsd += usd;
    }
  }

  let allInside48h = false;
  if (timestamps.length > 1) {
    const min = Math.min(...timestamps);
    const max = Math.max(...timestamps);
    allInside48h = max - min <= FORTY_EIGHT_HOURS_S;
  }

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
