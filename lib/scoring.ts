import type { ActivityStats, Criterion, ScoreResult } from "./types";

const TOKENS_BY_POINTS: Record<number, number> = {
  3: 1250,
  4: 1750,
  5: 2250,
  6: 3250,
  7: 3750,
  8: 4250,
  9: 6250,
  10: 6750,
  11: 7250,
};
const MAX_TOKENS = 10250;

export const TOTAL_SUPPLY = 10_000_000_000;
export const ARB_AIRDROP_PCT = 11.62;
export const DEFAULT_FDV = 5_000_000_000;
export const DEFAULT_AIRDROP_PCT = 25;

export type Valuation = {
  scaledTokens: number;
  tokenPrice: number;
  userUsd: number;
};

export function computeValue(
  baseTokens: number,
  fdv: number,
  airdropPct: number
): Valuation {
  const safeFdv = Number.isFinite(fdv) && fdv >= 0 ? fdv : 0;
  const safePct = Number.isFinite(airdropPct) && airdropPct >= 0 ? airdropPct : 0;
  const scaledTokens = Math.round(baseTokens * (safePct / ARB_AIRDROP_PCT));
  const tokenPrice = safeFdv / TOTAL_SUPPLY;
  const userUsd = scaledTokens * tokenPrice;
  return { scaledTokens, tokenPrice, userUsd };
}

export function score(stats: ActivityStats): ScoreResult {
  const interactions = Math.max(stats.txCount, stats.contractCount);

  const criteria: Criterion[] = [
    {
      id: "bridged",
      group: "bridged",
      label: "BRIDGED TO BASE",
      met: stats.hasBridged,
      detail: stats.hasBridged
        ? "Deposit transaction detected on L2"
        : "No L1→L2 deposit transaction found",
    },
    {
      id: "months-2",
      group: "time",
      label: "TRANSACTIONS OVER TIME",
      met: stats.monthsActive >= 2,
      detail: `Active in ${stats.monthsActive} distinct month${stats.monthsActive === 1 ? "" : "s"} (requires 2+)`,
    },
    {
      id: "months-6",
      group: "time",
      label: "TRANSACTIONS ACROSS 6 MONTHS",
      met: stats.monthsActive >= 6,
      detail: `Active in ${stats.monthsActive} months (requires 6+)`,
    },
    {
      id: "months-9",
      group: "time",
      label: "TRANSACTIONS ACROSS 9 MONTHS",
      met: stats.monthsActive >= 9,
      detail: `Active in ${stats.monthsActive} months (requires 9+)`,
    },
    {
      id: "freq-4",
      group: "frequency",
      label: "TRANSACTION FREQUENCY AND INTERACTION",
      met: interactions > 4,
      detail: `${stats.txCount} transactions, ${stats.contractCount} unique contracts (requires >4)`,
    },
    {
      id: "freq-10",
      group: "frequency",
      label: ">10 TRANSACTIONS OR CONTRACTS",
      met: interactions > 10,
      detail: `${stats.txCount} txs, ${stats.contractCount} contracts (requires >10)`,
    },
    {
      id: "freq-25",
      group: "frequency",
      label: ">25 TRANSACTIONS OR CONTRACTS",
      met: interactions > 25,
      detail: `${stats.txCount} txs, ${stats.contractCount} contracts (requires >25)`,
    },
    {
      id: "freq-100",
      group: "frequency",
      label: ">100 TRANSACTIONS OR CONTRACTS",
      met: interactions > 100,
      detail: `${stats.txCount} txs, ${stats.contractCount} contracts (requires >100)`,
    },
    {
      id: "value-10k",
      group: "value",
      label: "TRANSACTION VALUE",
      met: stats.aggValueUsd > 10_000,
      detail: `Aggregate value $${fmt(stats.aggValueUsd)} (requires >$10k)`,
    },
    {
      id: "value-50k",
      group: "value",
      label: ">$50K TRANSACTION VALUE",
      met: stats.aggValueUsd > 50_000,
      detail: `Aggregate value $${fmt(stats.aggValueUsd)} (requires >$50k)`,
    },
    {
      id: "value-250k",
      group: "value",
      label: ">$250K TRANSACTION VALUE",
      met: stats.aggValueUsd > 250_000,
      detail: `Aggregate value $${fmt(stats.aggValueUsd)} (requires >$250k)`,
    },
    {
      id: "bridge-10k",
      group: "bridgedValue",
      label: "ASSETS BRIDGED TO BASE",
      met: stats.bridgedUsd > 10_000,
      detail: `$${fmt(stats.bridgedUsd)} bridged (requires >$10k)`,
    },
    {
      id: "bridge-50k",
      group: "bridgedValue",
      label: ">$50K ASSETS BRIDGED",
      met: stats.bridgedUsd > 50_000,
      detail: `$${fmt(stats.bridgedUsd)} bridged (requires >$50k)`,
    },
    {
      id: "bridge-250k",
      group: "bridgedValue",
      label: ">$250K ASSETS BRIDGED",
      met: stats.bridgedUsd > 250_000,
      detail: `$${fmt(stats.bridgedUsd)} bridged (requires >$250k)`,
    },
    {
      id: "basename",
      group: "basename",
      label: "OWNS A BASE NAME",
      met: stats.hasBaseName,
      detail: stats.hasBaseName
        ? `Primary name: ${stats.baseName}`
        : "No Basename set as primary",
    },
  ];

  const rawPoints = Math.min(15, criteria.filter((c) => c.met).length);

  const deductions = [
    {
      label: "All transactions within a 48-hour window",
      applied: stats.txCount > 0 && stats.allInside48h,
    },
    {
      label: "Balance <0.005 ETH and ≤1 contract interaction",
      applied: stats.ethBalance < 0.005 && stats.contractCount <= 1,
    },
  ];
  const deductionCount = deductions.filter((d) => d.applied).length;
  const finalPoints = Math.max(0, rawPoints - deductionCount);

  let baseTokens = 0;
  if (finalPoints >= 12) baseTokens = MAX_TOKENS;
  else if (finalPoints >= 3) baseTokens = TOKENS_BY_POINTS[finalPoints] ?? 0;

  return {
    criteria,
    rawPoints,
    deductions,
    finalPoints,
    baseTokens,
    eligible: finalPoints >= 3,
  };
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}
