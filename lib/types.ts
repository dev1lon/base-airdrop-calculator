export type Criterion = {
  id: string;
  label: string;
  met: boolean;
  detail: string;
  group: "bridged" | "time" | "frequency" | "value" | "bridgedValue" | "basename";
};

export type ActivityStats = {
  address: string;
  txCount: number;
  contractCount: number;
  monthsActive: number;
  aggValueUsd: number;
  bridgedUsd: number;
  hasBridged: boolean;
  hasBaseName: boolean;
  baseName: string | null;
  ethBalance: number;
  allInside48h: boolean;
  ethPriceUsd: number;
};

export type ScoreResult = {
  criteria: Criterion[];
  rawPoints: number;
  deductions: { label: string; applied: boolean }[];
  finalPoints: number;
  baseTokens: number;
  eligible: boolean;
};

export type CheckResponse = {
  ok: true;
  address: string;
  resolvedFromName: string | null;
  stats: ActivityStats;
  score: ScoreResult;
} | {
  ok: false;
  error: string;
};

export type ConfigResponse = {
  ok: true;
  defaultSupply: number;
  defaultFdv: number;
  defaultAirdropPct: number;
};

export type ValuationResponse = {
  ok: true;
  valuation: { scaledTokens: number; tokenPrice: number; userUsd: number };
};
