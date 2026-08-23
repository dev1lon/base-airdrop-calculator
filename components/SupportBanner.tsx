"use client";

import { useEffect, useState } from "react";
import {
  VOUCH_DEADLINE_ISO,
  VOUCH_POST_URL,
  VOUCH_PROMO_CODE,
  VOUCH_SIGNUP_URL,
  VOUCH_TEXT,
} from "@/lib/links";

const DEADLINE_MS = new Date(VOUCH_DEADLINE_ISO).getTime();

// "1d 4h 12m" / "4h 12m" / "12m 30s" — coarse units first, seconds only in the
// last hour, so the line stays calm until it actually gets urgent.
function formatLeft(ms: number): string {
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${sec}s`;
}

// Support ask shown on every page load — deliberately not persisted in
// localStorage, so a refresh brings it back. Bottom sheet on phones, centered
// dialog on desktop.
export function SupportBanner() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  // null until the first client tick, so the server and client markup match.
  const [msLeft, setMsLeft] = useState<number | null>(null);

  // Small delay so the calculator paints first and the sheet reads as an
  // intentional overlay rather than a blocking splash screen. Past the
  // deadline the banner simply never opens — the code stays in place for the
  // next campaign, it just stops showing.
  useEffect(() => {
    if (Date.now() >= DEADLINE_MS) return;
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Ticks every second: cheap, and the last hour needs second precision.
  useEffect(() => {
    if (!open) return;
    const tick = () => {
      const left = DEADLINE_MS - Date.now();
      setMsLeft(left);
      // Deadline hit while the sheet is open on a long-lived tab: dismiss it.
      if (left <= 0) setOpen(false);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [open]);

  async function copyText() {
    try {
      await navigator.clipboard.writeText(VOUCH_TEXT);
    } catch {
      // Clipboard API is blocked in some in-app browsers; fall back to a
      // hidden textarea + execCommand so the button still does something.
      const ta = document.createElement("textarea");
      ta.value = VOUCH_TEXT;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        document.body.removeChild(ta);
        return;
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-banner-title"
    >
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px] banner-fade"
        onClick={() => setOpen(false)}
      />

      <div className="banner-sheet banner-in relative flex w-full flex-col overflow-hidden rounded-2xl border border-base-border bg-white shadow-2xl sm:max-w-lg">
        {/* Base-blue rail keeps the sheet on-brand without a heavy header */}
        <div className="h-1 shrink-0 bg-base-blue" />

        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute right-3 top-4 z-10 grid h-9 w-9 place-items-center rounded-full text-base-mute transition-colors hover:bg-base-panel hover:text-base-text active:bg-base-panelStrong"
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
            <path
              d="M5 5l10 10M15 5L5 15"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6 pt-6 sm:px-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-base-blueLight px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-base-blue">
              Free · 1 minute
            </span>
            {msLeft !== null && msLeft > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-base-red/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-base-red">
                <span className="h-1.5 w-1.5 rounded-full bg-base-red" />
                Ends in {formatLeft(msLeft)}
              </span>
            )}
          </div>

          <h2
            id="support-banner-title"
            className="mt-3 pr-10 text-xl font-semibold leading-tight sm:text-2xl"
          >
            Support this project
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-base-mute sm:text-[15px]">
            The calculator is free and ad-free. If you would like to help it
            keep growing, the two steps below are all it takes — no money, no
            wallet, about a minute of your time.
          </p>

          <ol className="mt-5 space-y-4">
            <li className="flex gap-3">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-base-blue text-xs font-semibold text-white">
                1
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium sm:text-[15px]">
                  Sign up on Commonsmade
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-base-mute">
                  Connects with X or GitHub. Promo code{" "}
                  <span className="font-mono font-semibold text-base-text">
                    {VOUCH_PROMO_CODE}
                  </span>{" "}
                  gives 2x points — not a referral, just a nice head start.
                </p>
                <a
                  href={VOUCH_SIGNUP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-base-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-base-blueHover active:bg-base-blueHover sm:w-auto"
                >
                  Open sign-up
                  <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                    <path
                      d="M7 4h9v9M16 4L4 16"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </a>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-base-blue text-xs font-semibold text-white">
                2
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium sm:text-[15px]">
                  Leave one comment under the post
                </p>
                <div className="mt-2 rounded-xl border border-base-border bg-base-panel px-3 py-2.5">
                  <p className="break-words font-mono text-[13px] leading-relaxed text-base-text">
                    {VOUCH_TEXT}
                  </p>
                </div>
                <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={copyText}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-base-border bg-white px-4 py-2.5 text-sm font-semibold text-base-text transition-colors hover:bg-base-panel active:bg-base-panelStrong"
                  >
                    {copied ? "Copied ✓" : "Copy text"}
                  </button>
                  <a
                    href={VOUCH_POST_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-base-blue bg-base-blue/5 px-4 py-2.5 text-sm font-semibold text-base-blue transition-colors hover:bg-base-blue/10"
                  >
                    Open the post
                    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                      <path
                        d="M7 4h9v9M16 4L4 16"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </li>
          </ol>

          <p className="mt-5 text-[12px] leading-relaxed text-base-muteSoft">
            Thank you — every vouch genuinely helps.
          </p>
        </div>
      </div>
    </div>
  );
}
