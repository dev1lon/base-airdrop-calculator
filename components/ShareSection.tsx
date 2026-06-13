"use client";

import { useRef, useState } from "react";
import { toBlob, toPng } from "html-to-image";
import { ShareCard } from "./ShareCard";

type Props = {
  scaledTokens: number;
  userUsd: number;
  finalPoints: number;
  maxPoints: number;
  address: string;
  resolvedFromName: string | null;
  baseName: string | null;
};

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
  return (
    `my $BASE airdrop estimate:  ${usd} 👀\n\n` +
    `check yours → ${url}\n\n` +
    `via @devilonnn`
  );
}

export function ShareSection(props: Props) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleShare() {
    const intent = `https://x.com/intent/post?text=${encodeURIComponent(tweetText(props.userUsd))}`;
    window.open(intent, "_blank", "noopener,noreferrer");
  }

  async function handleSave() {
    if (saving || !cardRef.current) return;
    setSaving(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#FFFFFF",
      });
      const link = document.createElement("a");
      link.download = "base-airdrop.png";
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("[ShareSection] capture failed:", e);
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    if (copied || !cardRef.current) return;
    try {
      const blob = await toBlob(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#FFFFFF",
      });
      if (!blob) throw new Error("blob is null");
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("[ShareSection] copy failed:", e);
    }
  }

  return (
    <div>
      <p className="uppercase text-xs tracking-widest text-base-mute mb-3">
        Share your result
      </p>

      <ShareCard ref={cardRef} {...props} />

      <div className="mt-4 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center justify-center gap-2 bg-base-text hover:bg-black text-white text-sm font-semibold rounded-full px-5 py-2.5 transition-colors"
        >
          Share on X
          <span aria-hidden>→</span>
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center justify-center gap-2 bg-base-panel hover:bg-base-panelStrong text-base-text text-sm font-semibold rounded-full px-5 py-2.5 border border-base-border transition-colors"
        >
          {copied ? "Copied!" : "Copy image"}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 bg-base-panel hover:bg-base-panelStrong disabled:opacity-60 text-base-text text-sm font-semibold rounded-full px-5 py-2.5 border border-base-border transition-colors"
        >
          {saving ? "Generating…" : "Download image"}
        </button>
      </div>
    </div>
  );
}
