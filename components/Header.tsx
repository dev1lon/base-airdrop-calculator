import { ConnectWallet } from "./ConnectWallet";
import { RUGPULLRUN_URL, SNAKE_GAME_URL } from "@/lib/links";
import { RugPullRunIcon, SnakeGameIcon } from "./PartnerIcons";

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

        {/* Mobile: wallet takes its own row, the two game pills split the next
            one evenly. Desktop: all three sit inline. */}
        <div className="ml-auto w-full sm:w-auto flex flex-wrap items-center gap-2">
          <div className="w-full sm:w-auto flex">
            <ConnectWallet />
          </div>
          <a
            href={SNAKE_GAME_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-full border border-base-border bg-base-blue/5 px-3 py-1.5 text-xs sm:text-sm font-medium text-base-blue hover:bg-base-blue/10 transition-colors"
          >
            <SnakeGameIcon className="h-5 w-5" />
            <span className="whitespace-nowrap">
              <span className="hidden sm:inline">Play </span>Snake Game
            </span>
          </a>
          <a
            href={RUGPULLRUN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-full border border-base-border bg-base-blue/5 px-3 py-1.5 text-xs sm:text-sm font-medium text-base-blue hover:bg-base-blue/10 transition-colors"
          >
            <RugPullRunIcon className="h-5 w-5" />
            <span className="whitespace-nowrap">
              <span className="hidden sm:inline">Play </span>RugPullRun
            </span>
          </a>
        </div>
      </div>
    </header>
  );
}
