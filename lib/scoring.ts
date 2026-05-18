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

export const DEFAULT_SUPPLY = 10_000_000_000;
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
  airdropPct: number,
  totalSupply: number
): Valuation {
  const safeFdv = Number.isFinite(fdv) && fdv >= 0 ? fdv : 0;
  const safePct = Number.isFinite(airdropPct) && airdropPct >= 0 ? airdropPct : 0;
  const safeSupply = Number.isFinite(totalSupply) && totalSupply > 0 ? totalSupply : DEFAULT_SUPPLY;
  const scaledTokens = Math.round(baseTokens * (safePct / ARB_AIRDROP_PCT));
  const tokenPrice = safeFdv / safeSupply;
  const userUsd = scaledTokens * tokenPrice;
  return { scaledTokens, tokenPrice, userUsd };
}

export function score(stats: ActivityStats): ScoreResult {
  const interactions = Math.max(stats.txCount, stats.contractCount);

  const criteria: Criterion[] = [
    {
      id: "bridged",
      group: "bridged",
      label: "You've bridged funds into Base",
      met: stats.hasBridged,
      detail: stats.hasBridged
        ? "Canonical L2StandardBridge deposit detected"
        : "No canonical bridge deposit detected on L2",
    },
    {
      id: "months-2",
      group: "time",
      label: "You've conducted transactions during 2 distinct months",
      met: stats.monthsActive >= 2,
      detail: `Active in ${stats.monthsActive} distinct month${stats.monthsActive === 1 ? "" : "s"}`,
    },
    {
      id: "months-6",
      group: "time",
      label: "You've conducted transactions during 6 distinct months",
      met: stats.monthsActive >= 6,
      detail: `Active in ${stats.monthsActive} months`,
    },
    {
      id: "months-9",
      group: "time",
      label: "You've conducted transactions during 9 distinct months",
      met: stats.monthsActive >= 9,
      detail: `Active in ${stats.monthsActive} months`,
    },
    {
      id: "freq-4",
      group: "frequency",
      label: "You've conducted more than 4 transactions OR interacted with more than 4 smart contracts",
      met: interactions > 4,
      detail: `${stats.txCount} transactions, ${stats.contractCount} unique contracts`,
    },
    {
      id: "freq-10",
      group: "frequency",
      label: "You've conducted more than 10 transactions OR interacted with more than 10 smart contracts",
      met: interactions > 10,
      detail: `${stats.txCount} transactions, ${stats.contractCount} unique contracts`,
    },
    {
      id: "freq-25",
      group: "frequency",
      label: "You've conducted more than 25 transactions OR interacted with more than 25 smart contracts",
      met: interactions > 25,
      detail: `${stats.txCount} transactions, ${stats.contractCount} unique contracts`,
    },
    {
      id: "freq-100",
      group: "frequency",
      label: "You've conducted more than 100 transactions OR interacted with more than 100 smart contracts",
      met: interactions > 100,
      detail: `${stats.txCount} transactions, ${stats.contractCount} unique contracts`,
    },
    {
      id: "value-10k",
      group: "value",
      label: "You've conducted transactions with more than $10,000 in aggregate value",
      met: stats.aggValueUsd > 10_000,
      detail: `Aggregate value $${fmt(stats.aggValueUsd)}`,
    },
    {
      id: "value-50k",
      group: "value",
      label: "You've conducted transactions with more than $50,000 in aggregate value",
      met: stats.aggValueUsd > 50_000,
      detail: `Aggregate value $${fmt(stats.aggValueUsd)}`,
    },
    {
      id: "value-250k",
      group: "value",
      label: "You've conducted transactions with more than $250,000 in aggregate value",
      met: stats.aggValueUsd > 250_000,
      detail: `Aggregate value $${fmt(stats.aggValueUsd)}`,
    },
    {
      id: "bridge-10k",
      group: "bridgedValue",
      label: "You've bridged more than $10,000 of assets to Base",
      met: stats.bridgedUsd > 10_000,
      detail: `$${fmt(stats.bridgedUsd)} bridged via canonical bridge`,
    },
    {
      id: "bridge-50k",
      group: "bridgedValue",
      label: "You've bridged more than $50,000 of assets to Base",
      met: stats.bridgedUsd > 50_000,
      detail: `$${fmt(stats.bridgedUsd)} bridged via canonical bridge`,
    },
    {
      id: "bridge-250k",
      group: "bridgedValue",
      label: "You've bridged more than $250,000 of assets to Base",
      met: stats.bridgedUsd > 250_000,
      detail: `$${fmt(stats.bridgedUsd)} bridged via canonical bridge`,
    },
    {
      id: "basename",
      group: "basename",
      label: "You own a primary Base Name",
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
