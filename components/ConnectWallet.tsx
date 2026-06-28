"use client";

import {
  useActiveAccount,
  useActiveWallet,
  useConnectModal,
  useDisconnect,
} from "thirdweb/react";
import { cardChain, thirdwebClient, wallets } from "@/lib/mint";

function shortAddr(a: string): string {
  return `${a.slice(0, 5)}…${a.slice(-4)}`;
}

// Compact connect button styled to match the header pills. Shows "Connect
// Wallet" when disconnected, the short address (click to disconnect) when
// connected. Works with any wallet; auto-connects inside the Base app.
export function ConnectWallet() {
  const account = useActiveAccount();
  const activeWallet = useActiveWallet();
  const { connect, isConnecting } = useConnectModal();
  const { disconnect } = useDisconnect();

  if (account) {
    return (
      <button
        type="button"
        onClick={() => activeWallet && disconnect(activeWallet)}
        title="Disconnect"
        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-full border border-base-border bg-base-panel hover:bg-base-panelStrong px-3 py-1.5 text-xs sm:text-sm font-medium font-mono text-base-text transition-colors"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-base-green" />
        {shortAddr(account.address)}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() =>
        connect({ client: thirdwebClient, wallets, chain: cardChain })
      }
      disabled={isConnecting}
      className="flex-1 sm:flex-initial inline-flex items-center justify-center rounded-full bg-base-blue hover:bg-base-blueHover disabled:opacity-60 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white transition-colors"
    >
      {isConnecting ? "Connecting…" : "Connect Wallet"}
    </button>
  );
}
