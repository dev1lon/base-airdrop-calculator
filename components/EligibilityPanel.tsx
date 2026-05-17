"use client";

import type { ScoreResult } from "@/lib/types";

type Props = {
  address: string | null;
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

export function EligibilityPanel({ address, score, scaledTokens, userUsd, loading }: Props) {
  if (loading) {
    return (
      <div>
        <h1 className="text-5xl sm:text-6xl font-light leading-tight">Checking…</h1>
        <p className="text-base-mute mt-6 text-lg">Scanning wallet activity on Base mainnet.</p>
      </div>
    );
  }

  if (!score) {
    return (
      <div>
        <h1 className="text-5xl sm:text-6xl font-light leading-tight">
          $BASE<br />Airdrop<br />Calculator
        </h1>
        <p className="text-base-mute mt-6 text-lg max-w-md">
          Enter any wallet address to estimate a hypothetical $BASE airdrop —
          scored with the legendary airdrop Arbitrum did for $ARB, applied to
          your Base mainnet activity.
        </p>
      </div>
    );
  }

  const eligible = score.eligible;

  return (
    <div>
      <h1 className="text-5xl sm:text-6xl font-light leading-tight">
        {eligible ? (
          <>You&rsquo;re<br />Eligible!</>
        ) : (
          <>Not<br />Eligible</>
        )}
      </h1>

      {eligible ? (
        <>
          <p className="uppercase text-xs tracking-widest text-base-mute mt-8">You will receive</p>
          <div className="mt-3 inline-flex items-center gap-3 bg-base-panel border border-base-border rounded-full pl-3 pr-6 py-2">
            <div className="w-7 h-7 rounded-full bg-base-blue flex items-center justify-center text-white text-xs font-bold">B</div>
            <span className="font-mono text-lg">{fmtNum(scaledTokens)} $BASE</span>
          </div>
          <div className="mt-4 font-mono text-2xl text-base-green">{fmtUsd(userUsd)}</div>
        </>
      ) : (
        <p className="text-base-mute mt-6 text-lg max-w-md">
          You scored {score.finalPoints} point{score.finalPoints === 1 ? "" : "s"}.
          A minimum of three points is required to be eligible.
        </p>
      )}

      {address && (
        <p className="text-xs text-base-mute mt-6 font-mono">{shortAddr(address)}</p>
      )}
    </div>
  );
}
