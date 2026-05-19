"use client";

import { forwardRef } from "react";

type Props = {
  scaledTokens: number;
  userUsd: number;
  finalPoints: number;
  address: string;
  resolvedFromName: string | null;
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
  { scaledTokens, userUsd, finalPoints, address, resolvedFromName },
  ref
) {
  const ident = resolvedFromName ?? shortAddr(address);
  return (
    <div
      ref={ref}
      className="aspect-[1200/630] w-full bg-white border border-base-border rounded-2xl overflow-hidden p-5 sm:p-8 flex flex-col justify-between"
      style={{
        backgroundImage:
          "radial-gradient(circle at 15% 20%, rgba(0,82,255,0.10), transparent 45%)," +
          "radial-gradient(circle at 85% 85%, rgba(0,82,255,0.08), transparent 50%)",
      }}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/coin.png"
          alt=""
          className="rounded-full w-6 h-6 sm:w-8 sm:h-8"
          crossOrigin="anonymous"
        />
        <span className="font-semibold tracking-wide text-[11px] sm:text-sm">
          BASE AIRDROP CALCULATOR
        </span>
      </div>

      <div>
        <div className="uppercase tracking-widest text-base-mute text-[10px] sm:text-xs mb-1 sm:mb-2">
          You&rsquo;re Eligible!
        </div>
        <div className="font-mono text-base-green font-semibold leading-none tracking-tight text-[clamp(2.5rem,9vw,5.5rem)]">
          {fmtUsd(userUsd)}
        </div>
        <div className="mt-3 sm:mt-5 inline-flex items-center gap-2 sm:gap-3 bg-base-panel border border-base-border rounded-full pl-1.5 pr-4 sm:pr-6 py-1.5 sm:py-2">
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
        </div>
      </div>

      <div className="flex items-center justify-between font-mono text-[10px] sm:text-sm text-base-mute">
        <span className="truncate pr-2">{ident}</span>
        <span className="whitespace-nowrap">Score {finalPoints} / 15</span>
      </div>
    </div>
  );
});
