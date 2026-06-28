import { ConnectWallet } from "./ConnectWallet";

export function Header() {
  return (
    <header className="border-b border-base-border/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 sm:py-5 flex flex-wrap items-center gap-x-3 gap-y-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/coin.png"
          alt="Base"
          width={28}
          height={28}
          className="rounded-full shrink-0"
        />
        <span className="font-semibold tracking-wide text-sm sm:text-base">BASE AIRDROP CALCULATOR</span>

        <div className="ml-auto w-full sm:w-auto flex items-center gap-2">
          <ConnectWallet />
          <a
            href="https://rugpullrun.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-full border border-base-border bg-base-blue/5 px-3 py-1.5 text-xs sm:text-sm font-medium text-base-blue hover:bg-base-blue/10 transition-colors"
          >
            <span aria-hidden>🎮</span>
            <span className="hidden sm:inline">Play</span>
            <span>RugPullRun</span>
          </a>
        </div>
      </div>
    </header>
  );
}
