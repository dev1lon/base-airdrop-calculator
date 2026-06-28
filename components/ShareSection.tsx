"use client";

import { useRef, useState } from "react";
import { toBlob } from "html-to-image";
import { prepareContractCall } from "thirdweb";
import {
  useActiveAccount,
  useConnectModal,
  useSendTransaction,
} from "thirdweb/react";
import { upload } from "thirdweb/storage";
import { ShareCard } from "./ShareCard";
import {
  cardChain,
  cardContract,
  MINT_PRICE_ETH,
  MINT_PRICE_WEI,
  thirdwebClient,
  wallets,
} from "@/lib/mint";

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
  const [copied, setCopied] = useState(false);
  const [qty, setQty] = useState(1);
  const [minting, setMinting] = useState(false);
  const [mintMsg, setMintMsg] = useState<string | null>(null);
  const [mintOk, setMintOk] = useState(false);

  const account = useActiveAccount();
  const { connect } = useConnectModal();
  const { mutateAsync: sendTransaction } = useSendTransaction();

  function handleShare() {
    const intent = `https://x.com/intent/post?text=${encodeURIComponent(tweetText(props.userUsd))}`;
    window.open(intent, "_blank", "noopener,noreferrer");
  }

  async function renderBlob(): Promise<Blob> {
    const blob = await toBlob(cardRef.current!, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#FFFFFF",
    });
    if (!blob) throw new Error("Could not render card");
    return blob;
  }

  function flashCopied() {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCopy() {
    if (copied || !cardRef.current) return;
    // Desktop path: copy the PNG to the clipboard. Safari/mobile lose the user
    // gesture across the async render, so the ClipboardItem is given a Promise
    // (created synchronously) which preserves activation where supported.
    try {
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": renderBlob() }),
        ]);
        flashCopied();
        return;
      }
      throw new Error("clipboard unsupported");
    } catch {
      // Mobile / in-app browsers (Base app) can't copy images — fall back to
      // the native share sheet (save / send / copy), else a download.
      try {
        const blob = await renderBlob();
        const file = new File([blob], "base-airdrop-card.png", {
          type: "image/png",
        });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file] });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "base-airdrop-card.png";
          a.click();
          URL.revokeObjectURL(url);
        }
        flashCopied();
      } catch (e) {
        console.error("[ShareSection] copy failed:", e);
      }
    }
  }

  async function handleMint() {
    if (minting || !cardRef.current) return;
    setMintMsg(null);
    setMintOk(false);
    setMinting(true);
    try {
      // Connect a wallet if needed (opens the wallet picker; auto in Base app).
      if (!account) {
        await connect({ client: thirdwebClient, wallets, chain: cardChain });
      }

      // 1. Snapshot the card to PNG.
      setMintMsg("Preparing image…");
      const blob = await renderBlob();

      // 2. Upload image, then metadata, to IPFS via thirdweb storage.
      setMintMsg("Uploading to IPFS…");
      const imageUri = await upload({
        client: thirdwebClient,
        files: [new File([blob], "base-airdrop-card.png", { type: "image/png" })],
      });
      const metadata = {
        name: "BASE Airdrop Card",
        description:
          "My $BASE airdrop estimate from the BASE Airdrop Calculator.",
        image: imageUri,
        attributes: [
          { trait_type: "Score", value: props.finalPoints },
          { trait_type: "Max Score", value: props.maxPoints },
          { trait_type: "Estimated USD", value: Math.round(props.userUsd) },
          { trait_type: "Tokens", value: props.scaledTokens },
        ],
      };
      const metadataUri = await upload({
        client: thirdwebClient,
        files: [
          new File([JSON.stringify(metadata)], "metadata.json", {
            type: "application/json",
          }),
        ],
      });

      // 3. Mint `qty` copies in one transaction.
      setMintMsg("Confirm in your wallet…");
      const tx = prepareContractCall({
        contract: cardContract,
        method:
          "function mintBatch(string uri, uint256 quantity) payable returns (uint256)",
        params: [metadataUri, BigInt(qty)],
        value: MINT_PRICE_WEI * BigInt(qty),
      });
      const result = await sendTransaction(tx);

      setMintOk(true);
      setMintMsg(
        `Minted ${qty} card${qty === 1 ? "" : "s"}! tx ${result.transactionHash.slice(0, 10)}…`
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const cancelled = /reject|denied|user cancel|closed modal/i.test(msg);
      setMintMsg(cancelled ? "Cancelled." : `Failed: ${msg.slice(0, 160)}`);
      if (!cancelled) console.error("[ShareSection] mint failed:", e);
    } finally {
      setMinting(false);
    }
  }

  const totalEth = (MINT_PRICE_ETH * qty).toFixed(3);

  return (
    <div>
      <p className="uppercase text-xs tracking-widest text-base-mute mb-3">
        Share your result
      </p>

      <ShareCard ref={cardRef} {...props} />

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Mint + quantity — left */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleMint}
            disabled={minting}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center bg-base-blue hover:bg-base-blueHover disabled:opacity-60 text-white text-sm font-semibold rounded-full px-6 py-2.5 transition-colors"
          >
            {minting ? "Minting…" : "Mint"}
          </button>
          <div className="relative shrink-0">
            <select
              aria-label="Quantity to mint"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              disabled={minting}
              className="appearance-none bg-base-panel hover:bg-base-panelStrong disabled:opacity-60 border border-base-border rounded-full pl-4 pr-9 py-2.5 text-sm font-semibold text-base-text text-center cursor-pointer transition-colors"
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] text-base-mute">
              ▼
            </span>
          </div>
        </div>

        {/* Share + Copy — paired equal row on mobile, spread out on desktop */}
        <div className="flex gap-3 sm:contents">
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-base-text hover:bg-black text-white text-sm font-semibold rounded-full px-5 py-2.5 transition-colors"
          >
            Share on X
            <span aria-hidden>→</span>
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-base-panel hover:bg-base-panelStrong text-base-text text-sm font-semibold rounded-full px-5 py-2.5 border border-base-border transition-colors"
          >
            {copied ? "Copied!" : "Copy image"}
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-1 text-xs">
        <span className="text-base-mute font-mono">
          {qty} × {MINT_PRICE_ETH} ETH = {totalEth} ETH
        </span>
        {mintMsg && (
          <span className={mintOk ? "text-base-green" : "text-base-mute"}>
            {mintMsg}
          </span>
        )}
      </div>
    </div>
  );
}
