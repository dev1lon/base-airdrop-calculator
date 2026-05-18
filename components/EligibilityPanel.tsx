"use client";

import type { ScoreResult } from "@/lib/types";

type Props = {
  address: string | null;
  resolvedFromName: string | null;
  score: ScoreResult | null;
  scaledTokens: number;
  userUsd: number;
  loading: boolean;
};

function shortAddr(a: string): string {
  return a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

function fmtNum(n: number): string {
  if (n >= 1000) return Math.round(n).toLocaleString("en-US");
  return n.toFixed(2);
}

function fmtUsd(n: number): string {
  if (n >= 1000) return `$${Math.round(n).toLocaleString("en-US")}`;
  return `$${n.toFixed(2)}`;
}

const PANEL_HEIGHT = "min-h-[340px]";

export function EligibilityPanel({ address, resolvedFromName, score, scaledTokens, userUsd, loading }: Props) {
  if (loading && !score) {
    return (
      <div className={PANEL_HEIGHT}>
        <h1 className="text-4xl sm:text-5xl font-light leading-[1.05]">Checking…</h1>
        <p className="text-base-mute mt-6 text-base">Scanning wallet activity on Base mainnet.</p>
        <div className="mt-8 h-3 w-32 bg-base-panelStrong rounded animate-pulse" />
        <div className="mt-3 h-11 w-52 bg-base-panelStrong rounded-full animate-pulse" />
        <div className="mt-4 h-7 w-24 bg-base-panelStrong rounded animate-pulse" />
      </div>
    );
  }

  if (!score) {
    return (
      <div className={PANEL_HEIGHT}>
        <h1 className="text-4xl sm:text-5xl font-light leading-[1.05]">
          $BASE<br />Airdrop<br />Calculator
        </h1>
        <p className="text-base-mute mt-6 text-base max-w-md">
          Enter any wallet address to estimate a hypothetical $BASE airdrop —
          scored with the legendary airdrop Arbitrum did for $ARB, applied to
          your Base mainnet activity.
        </p>
      </div>
    );
  }

  const eligible = score.eligible;

  return (
    <div className={PANEL_HEIGHT}>
      <h1 className="text-4xl sm:text-5xl font-light leading-[1.05]">
        {eligible ? (
          <>You&rsquo;re<br />Eligible!</>
        ) : (
          <>Not<br />Eligible</>
        )}
      </h1>

      {eligible ? (
        <>
          <p className="uppercase text-xs tracking-widest text-base-mute mt-8">You will receive</p>
          <div className="mt-3 inline-flex items-center gap-3 bg-base-panel border border-base-border rounded-full pl-2 pr-6 py-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/coin.png" alt="" width={28} height={28} className="rounded-full" />
            <span className="font-mono text-lg">{fmtNum(scaledTokens)} $BASE</span>
          </div>
          <div className="mt-4 font-mono text-2xl text-base-green">{fmtUsd(userUsd)}</div>
        </>
      ) : (
        <p className="text-base-mute mt-6 text-base max-w-md">
          You scored {score.finalPoints} point{score.finalPoints === 1 ? "" : "s"}.
          A minimum of three points is required to be eligible.
        </p>
      )}

      {address && (
        <p className="text-xs text-base-mute mt-6 font-mono">
          {resolvedFromName ? `${resolvedFromName} → ${shortAddr(address)}` : shortAddr(address)}
        </p>
      )}
    </div>
  );
}
