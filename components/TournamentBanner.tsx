"use client";

import { useState } from "react";

// Attention-grabbing tournament promo. The blink is a lighter-blue layer that
// pulses opacity *behind* the steady white text — so it flashes without ever
// making the copy unreadable, and animates only `opacity` to stay smooth on
// weak Android. Dismissible so it never becomes annoying on repeat visits.
export function TournamentBanner() {
  const [closed, setClosed] = useState(false);
  if (closed) return null;

  return (
    <div className="relative overflow-hidden bg-base-blue text-white">
      <div
        className="tournament-flash pointer-events-none absolute inset-0 bg-[#4d8bff]"
        aria-hidden
      />

      <a
        href="https://rugpullrun.app"
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 px-9 sm:px-12 py-2 sm:py-2.5 text-center text-[13px] sm:text-[15px] font-semibold leading-tight"
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="live-blink inline-block w-2 h-2 rounded-full bg-red-400" />
          <span className="uppercase tracking-wider text-[10px] sm:text-[11px]">
            Live
          </span>
        </span>

        <span>🏆 RugPullRun Tournament</span>

        <span className="inline-flex items-center rounded-full bg-yellow-300 text-base-text px-2.5 py-0.5 font-extrabold">
          $50&nbsp;Prize&nbsp;Pool
        </span>

        <span className="opacity-90">· Play now</span>
        <span aria-hidden>→</span>
      </a>

      <button
        type="button"
        onClick={() => setClosed(true)}
        aria-label="Dismiss"
        className="absolute right-1.5 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-base text-white/80 transition-colors hover:bg-white/15 hover:text-white"
      >
        ×
      </button>
    </div>
  );
}
