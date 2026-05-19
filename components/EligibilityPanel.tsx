"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { ShareCard } from "./ShareCard";
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

function tweetText(userUsd: number): string {
  const usd = fmtUsd(userUsd);
  const url =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://base-airdrop-calculator.onrender.com";
  return `I'd get ${usd} in $BASE airdrop according to Arbitrum criteria 👀 check yours: ${url}`;
}

const PANEL_HEIGHT = "min-h-[340px]";

export function EligibilityPanel({ address, resolvedFromName, score, scaledTokens, userUsd, loading }: Props) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [sharing, setSharing] = useState(false);

  async function handleShare() {
    if (sharing) return;
    const node = cardRef.current;
    const text = tweetText(userUsd);
    const intent = `https://x.com/intent/post?text=${encodeURIComponent(text)}`;

    if (!node) {
      window.open(intent, "_blank", "noopener,noreferrer");
      return;
    }

    setSharing(true);
    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#FFFFFF",
      });
      const link = document.createElement("a");
      link.download = "base-airdrop.png";
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("[share] capture failed:", e);
    } finally {
      setSharing(false);
      window.open(intent, "_blank", "noopener,noreferrer");
    }
  }

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
  const addrLabel = address
    ? resolvedFromName
      ? `${resolvedFromName} → ${shortAddr(address)}`
      : shortAddr(address)
    : null;

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

          <p className="uppercase text-xs tracking-widest text-base-mute mt-6">Estimated value</p>
          <div className="mt-1 font-mono text-3xl text-base-green leading-none">
            {fmtUsd(userUsd)}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-base-mute">
            <span className="inline-flex items-center gap-1.5 bg-base-panel border border-base-border rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-base-green" />
              <span className="font-mono">Score {score.finalPoints} / 15</span>
            </span>
            {addrLabel && <span className="font-mono">{addrLabel}</span>}
          </div>

          <button
            type="button"
            onClick={handleShare}
            disabled={sharing}
            className="mt-5 inline-flex items-center gap-2 bg-base-text hover:bg-black disabled:opacity-60 text-white text-sm font-semibold rounded-full px-5 py-2.5 transition-colors"
          >
            {sharing ? "Generating…" : "Share on X"}
            <span aria-hidden>→</span>
          </button>

          {address && (
            <ShareCard
              ref={cardRef}
              scaledTokens={scaledTokens}
              userUsd={userUsd}
              finalPoints={score.finalPoints}
              address={address}
              resolvedFromName={resolvedFromName}
            />
          )}
        </>
      ) : (
        <>
          <p className="text-base-mute mt-6 text-base max-w-md">
            You scored {score.finalPoints} point{score.finalPoints === 1 ? "" : "s"}.
            A minimum of three points is required to be eligible.
          </p>
          <div className="mt-6 inline-flex items-center gap-1.5 bg-base-panel border border-base-border rounded-full px-3 py-1 text-xs text-base-mute">
            <span className="w-1.5 h-1.5 rounded-full bg-base-red" />
            <span className="font-mono">Score {score.finalPoints} / 15</span>
          </div>
          {addrLabel && (
            <p className="text-xs text-base-mute mt-4 font-mono">{addrLabel}</p>
          )}
        </>
      )}
    </div>
  );
}
