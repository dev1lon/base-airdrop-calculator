"use client";

import { forwardRef } from "react";

type Props = {
  scaledTokens: number;
  userUsd: number;
  finalPoints: number;
  maxPoints: number;
  address: string;
  resolvedFromName: string | null;
  baseName: string | null;
};

function fmtNum(n: number): string {
  if (n >= 1000) return Math.round(n).toLocaleString("en-US");
  return n.toFixed(2);
}

function fmtUsd(n: number): string {
  if (n >= 1000) return `$${Math.round(n).toLocaleString("en-US")}`;
  return `$${n.toFixed(2)}`;
}

function shortAddr(a: string): string {
  return a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

export const ShareCard = forwardRef<HTMLDivElement, Props>(function ShareCard(
  { scaledTokens, userUsd, finalPoints, maxPoints, address, resolvedFromName, baseName },
  ref
) {
  const ident = baseName ?? resolvedFromName ?? shortAddr(address);
  return (
    <div
      ref={ref}
      className="aspect-[1200/630] w-full bg-white border border-base-border rounded-2xl overflow-hidden px-5 sm:px-8 pt-3 sm:pt-4 pb-3 sm:pb-4 flex flex-col justify-between"
      style={{
        backgroundImage:
          "radial-gradient(circle at 15% 20%, rgba(0,82,255,0.10), transparent 45%)," +
          "radial-gradient(circle at 85% 85%, rgba(0,82,255,0.08), transparent 50%)",
      }}
    >
      <div className="flex items-center justify-between gap-3 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/coin.png"
            alt=""
            className="rounded-full w-6 h-6 sm:w-8 sm:h-8 shrink-0"
            crossOrigin="anonymous"
          />
          <span className="font-semibold tracking-wide text-[11px] sm:text-sm truncate">
            BASE AIRDROP CALCULATOR
          </span>
        </div>
        <span className="inline-flex items-center bg-base-panel border border-base-border rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 font-mono text-[10px] sm:text-sm text-base-mute max-w-[55%] truncate">
          {ident}
        </span>
      </div>

      <div className="font-mono text-base-green font-semibold leading-none tracking-tight text-[clamp(2.5rem,9vw,5.5rem)]">
        {fmtUsd(userUsd)}
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 sm:gap-3 bg-base-panel border border-base-border rounded-full pl-1.5 pr-4 sm:pr-6 py-1.5 sm:py-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/coin.png"
              alt=""
              className="rounded-full w-5 h-5 sm:w-7 sm:h-7"
              crossOrigin="anonymous"
            />
            <span className="font-mono text-xs sm:text-base">
              {fmtNum(scaledTokens)} $BASE
            </span>
          </span>
          <span className="inline-flex items-center bg-base-panel border border-base-border rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 font-mono text-[10px] sm:text-sm text-base-mute">
            Score {finalPoints} / {maxPoints}
          </span>
        </div>
        <div className="mt-1.5 sm:mt-2 text-center text-[9px] sm:text-xs text-base-mute/80">
          Created by <span className="font-mono">@devilonnn</span>
        </div>
      </div>
    </div>
  );
});
