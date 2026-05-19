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

// 1200x630 — Twitter/X large card aspect ratio.
// Rendered offscreen, captured to PNG via html-to-image on demand.
export const ShareCard = forwardRef<HTMLDivElement, Props>(function ShareCard(
  { scaledTokens, userUsd, finalPoints, address, resolvedFromName },
  ref
) {
  const ident = resolvedFromName ?? shortAddr(address);
  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        left: -99999,
        top: 0,
        width: 1200,
        height: 630,
        background:
          "radial-gradient(circle at 15% 20%, rgba(0,82,255,0.10), transparent 45%)," +
          "radial-gradient(circle at 85% 85%, rgba(0,82,255,0.08), transparent 50%)," +
          "#FFFFFF",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        color: "#0A0B0E",
        padding: 64,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/coin.png"
          alt=""
          width={56}
          height={56}
          style={{ borderRadius: 9999 }}
          crossOrigin="anonymous"
        />
        <span
          style={{
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "0.02em",
          }}
        >
          BASE AIRDROP CALCULATOR
        </span>
      </div>

      <div>
        <div
          style={{
            fontSize: 28,
            color: "#5C6473",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            marginBottom: 24,
          }}
        >
          You&rsquo;re Eligible!
        </div>
        <div
          style={{
            fontSize: 140,
            fontWeight: 600,
            color: "#15A36E",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          {fmtUsd(userUsd)}
        </div>
        <div
          style={{
            marginTop: 28,
            display: "inline-flex",
            alignItems: "center",
            gap: 16,
            background: "#F4F5F8",
            border: "1px solid #E5E7EB",
            borderRadius: 9999,
            padding: "12px 28px 12px 12px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/coin.png"
            alt=""
            width={44}
            height={44}
            style={{ borderRadius: 9999 }}
            crossOrigin="anonymous"
          />
          <span style={{ fontSize: 36, fontFamily: "JetBrains Mono, ui-monospace, monospace" }}>
            {fmtNum(scaledTokens)} $BASE
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 22,
          color: "#5C6473",
          fontFamily: "JetBrains Mono, ui-monospace, monospace",
        }}
      >
        <span>{ident}</span>
        <span>Score {finalPoints} / 15</span>
      </div>
    </div>
  );
});
