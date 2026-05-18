"use client";

import { useState } from "react";
import type { Criterion, ScoreResult } from "@/lib/types";

type Props = { score: ScoreResult | null; loading: boolean };

const GROUP_ORDER: Criterion["group"][] = [
  "bridged",
  "time",
  "frequency",
  "value",
  "bridgedValue",
  "basename",
];

const GROUP_LABELS: Record<Criterion["group"], string> = {
  bridged: "BRIDGED TO BASE",
  time: "TRANSACTIONS OVER TIME",
  frequency: "TRANSACTION FREQUENCY AND INTERACTION",
  value: "TRANSACTION VALUE",
  bridgedValue: "ASSETS BRIDGED TO BASE",
  basename: "OWNS A BASE NAME",
};

function GroupRow({
  label,
  items,
  loading,
}: {
  label: string;
  items: Criterion[];
  loading: boolean;
}) {
  const [open, setOpen] = useState(true);
  const anyMet = items.some((i) => i.met);

  return (
    <div className="border-b border-base-border/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-4 px-1 text-left hover:bg-black/[0.03] transition-colors"
        disabled={loading}
      >
        <div className="flex items-center gap-3">
          {loading ? (
            <span className="text-base-mute/40 text-lg leading-none">·</span>
          ) : anyMet ? (
            <span className="text-base-green text-lg leading-none">✓</span>
          ) : (
            <span className="text-base-red text-lg leading-none">✕</span>
          )}
          <span
            className={`uppercase text-sm tracking-wider ${loading ? "text-base-mute/50" : "text-base-text"}`}
          >
            {label}
          </span>
        </div>
        <span className="text-base-mute text-lg">{open ? "−" : "+"}</span>
      </button>

      {open && !loading && (
        <div className="pb-4 pl-2 pr-2 space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 pl-1">
              <span
                className={`text-base leading-tight pt-[1px] ${item.met ? "text-base-green" : "text-base-mute/30"}`}
              >
                ✓
              </span>
              <div className="flex-1 min-w-0">
                <div
                  className={`text-sm leading-snug ${item.met ? "text-base-text" : "text-base-mute/60"}`}
                >
                  {item.label}
                </div>
                {item.detail && (
                  <div className="text-[13px] text-base-text/75 font-mono mt-1">
                    {item.detail}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CriteriaList({ score, loading }: Props) {
  if (loading || !score) {
    return (
      <div>
        {GROUP_ORDER.map((g) => (
          <GroupRow key={g} label={GROUP_LABELS[g]} items={[]} loading />
        ))}
      </div>
    );
  }

  const byGroup: Record<Criterion["group"], Criterion[]> = {
    bridged: [],
    time: [],
    frequency: [],
    value: [],
    bridgedValue: [],
    basename: [],
  };
  for (const c of score.criteria) byGroup[c.group].push(c);

  return (
    <div>
      {GROUP_ORDER.map((g) => (
        <GroupRow
          key={g}
          label={GROUP_LABELS[g]}
          items={byGroup[g]}
          loading={false}
        />
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
        the Arbitrum airdrop exactly, applied to Base mainnet activity.
        <br />
        <span className="font-semibold text-base-text">
          Score: {score.finalPoints} / 15 points.
        </span>
      </p>
    </div>
  );
}
