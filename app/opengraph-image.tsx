import { ImageResponse } from "next/og";

export const alt = "$BASE Airdrop Calculator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TEXT = "#0A0B0E";
const MUTE = "#5C6473";
const BORDER = "#E5E7EB";
const BLUE = "#0052FF";
const GREEN = "#1AAD5E";
const PANEL_BG = "#F7F9FF";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          background: "#FFFFFF",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Left column — 960px */}
        <div
          style={{
            width: 960,
            padding: "56px 64px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Logo + title */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 9999,
                background: BLUE,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 3,
                  background: "#FFFFFF",
                  borderRadius: 2,
                }}
              />
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "0.14em",
                color: MUTE,
                textTransform: "uppercase",
              }}
            >
              BASE AIRDROP CALCULATOR
            </span>
          </div>

          {/* Headline */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 72,
                fontWeight: 700,
                color: TEXT,
                lineHeight: 1.04,
                letterSpacing: "-0.02em",
              }}
            >
              Check your $BASE airdrop.
            </div>
            <div
              style={{
                marginTop: 20,
                fontSize: 18,
                color: MUTE,
                lineHeight: 1.4,
                maxWidth: 720,
              }}
            >
              Scored using the Arbitrum airdrop criteria, applied to your Base
              mainnet activity.
            </div>
          </div>

          {/* Criteria checkboxes */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "14px 28px",
              maxWidth: 720,
            }}
          >
            {[
              { ok: true, label: "Transaction frequency" },
              { ok: true, label: "Transactions over time" },
              { ok: true, label: "Bridged to Base" },
              { ok: false, label: "Owns a Base Name" },
            ].map((row) => (
              <div
                key={row.label}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    border: `1.5px solid ${row.ok ? GREEN : "#DC2626"}`,
                    color: row.ok ? GREEN : "#DC2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                >
                  {row.ok ? "✓" : "✕"}
                </span>
                <span style={{ fontSize: 17, color: TEXT }}>{row.label}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div
            style={{
              alignSelf: "flex-start",
              background: BLUE,
              color: "#FFFFFF",
              padding: "14px 28px",
              borderRadius: 9999,
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span>Check eligibility</span>
            <span>→</span>
          </div>
        </div>

        {/* Right panel — 240px */}
        <div
          style={{
            width: 240,
            background: PANEL_BG,
            borderLeft: `1px solid ${BORDER}`,
            padding: "56px 28px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 22,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: 11,
                color: MUTE,
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                fontWeight: 600,
              }}
            >
              Estimated value
            </span>
            <span
              style={{
                marginTop: 8,
                fontSize: 48,
                color: GREEN,
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: "-0.02em",
              }}
            >
              $2,421
            </span>
            <span
              style={{
                marginTop: 10,
                fontSize: 16,
                color: BLUE,
                fontWeight: 600,
              }}
            >
              4,841 $BASE
            </span>
          </div>

          <div style={{ height: 1, background: BORDER }} />

          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: 11,
                color: MUTE,
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                fontWeight: 600,
              }}
            >
              Score
            </span>
            <span
              style={{
                marginTop: 6,
                fontSize: 26,
                color: BLUE,
                fontWeight: 700,
              }}
            >
              5 / 17
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
