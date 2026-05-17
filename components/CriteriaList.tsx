"use client";

import { useState } from "react";
import type { ScoreResult } from "@/lib/types";

type Props = { score: ScoreResult | null; loading: boolean };

const SKELETON_LABELS = [
  "BRIDGED TO BASE",
  "TRANSACTIONS OVER TIME",
  "TRANSACTION FREQUENCY AND INTERACTION",
  "TRANSACTION VALUE",
  "ASSETS BRIDGED TO BASE",
  "OWNS A BASE NAME",
];

function Row({
  label,
  met,
  detail,
  showState,
}: {
  label: string;
  met: boolean;
  detail: string;
  showState: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-base-border/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-4 text-left hover:bg-white/[0.02] px-1 transition-colors"
      >
        <div className="flex items-center gap-3">
          {showState ? (
            met ? (
              <span className="text-base-green text-lg leading-none">✓</span>
            ) : (
              <span className="text-base-red text-lg leading-none">✕</span>
            )
          ) : (
            <span className="text-base-mute/40 text-lg leading-none">·</span>
          )}
          <span
            className={`uppercase text-sm tracking-wider ${showState ? "text-base-text" : "text-base-mute/50"}`}
          >
            {label}
          </span>
        </div>
        <span className="text-base-mute text-lg">{open ? "−" : "+"}</span>
      </button>
      {open && showState && (
        <div className="pb-4 pl-7 pr-2 text-xs text-base-mute">{detail}</div>
      )}
    </div>
  );
}

export function CriteriaList({ score, loading }: Props) {
  if (loading || !score) {
    return (
      <div>
        {SKELETON_LABELS.map((label) => (
          <Row key={label} label={label} met={false} detail="" showState={false} />
        ))}
      </div>
    );
  }

  const condensed = condense(score);

  return (
    <div>
      {condensed.map((c) => (
        <Row key={c.id} label={c.label} met={c.met} detail={c.detail} showState />
      ))}
      {score.deductions.some((d) => d.applied) && (
        <div className="mt-4 text-xs text-base-red">
          {score.deductions
            .filter((d) => d.applied)
            .map((d) => (
              <div key={d.label}>− Sybil deduction: {d.label}</div>
            ))}
        </div>
      )}
      <p className="mt-6 text-xs text-base-mute leading-relaxed">
        A minimum of three points total is required to be eligible. Scoring mirrors
        the Arbitrum airdrop rubric exactly, applied to Base mainnet activity.
        <br />
        <span className="font-semibold text-base-text">
          Score: {score.finalPoints} / 15 points.
        </span>
      </p>
    </div>
  );
}

function condense(score: ScoreResult) {
  const pickHighestMet = (ids: string[], fallbackLabel: string) => {
    const all = score.criteria.filter((c) => ids.includes(c.id));
    const met = all.filter((c) => c.met);
    if (met.length > 0) {
      const top = met[met.length - 1]!;
      return { id: top.id, label: fallbackLabel, met: true, detail: top.detail };
    }
    const first = all[0]!;
    return { id: first.id, label: fallbackLabel, met: false, detail: first.detail };
  };

  const bridged = score.criteria.find((c) => c.id === "bridged")!;
  const time = pickHighestMet(["months-2", "months-6", "months-9"], "TRANSACTIONS OVER TIME");
  const freq = pickHighestMet(
    ["freq-4", "freq-10", "freq-25", "freq-100"],
    "TRANSACTION FREQUENCY AND INTERACTION"
  );
  const value = pickHighestMet(
    ["value-10k", "value-50k", "value-250k"],
    "TRANSACTION VALUE"
  );
  const bridgedValue = pickHighestMet(
    ["bridge-10k", "bridge-50k", "bridge-250k"],
    "ASSETS BRIDGED TO BASE"
  );
  const basename = score.criteria.find((c) => c.id === "basename")!;

  return [
    { id: bridged.id, label: bridged.label, met: bridged.met, detail: bridged.detail },
    time,
    freq,
    value,
    bridgedValue,
    { id: basename.id, label: basename.label, met: basename.met, detail: basename.detail },
  ];
}
