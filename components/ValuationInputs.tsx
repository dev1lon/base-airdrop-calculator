"use client";

import { useEffect, useState } from "react";

type Props = {
  fdv: number;
  setFdv: (v: number) => void;
  airdropPct: number;
  setAirdropPct: (v: number) => void;
};

type Unit = "M" | "B";
const UNIT_MULT: Record<Unit, number> = { M: 1e6, B: 1e9 };

function splitFdv(n: number): { amount: string; unit: Unit } {
  if (!Number.isFinite(n) || n <= 0) return { amount: "", unit: "B" };
  if (n >= 1e9) return { amount: trim(n / 1e9), unit: "B" };
  return { amount: trim(n / 1e6), unit: "M" };
}

function trim(n: number): string {
  return n.toFixed(4).replace(/\.?0+$/, "");
}

export function ValuationInputs({
  fdv,
  setFdv,
  airdropPct,
  setAirdropPct,
}: Props) {
  const initial = splitFdv(fdv);
  const [amount, setAmount] = useState(initial.amount);
  const [unit, setUnit] = useState<Unit>(initial.unit);
  const [pctRaw, setPctRaw] = useState(() => String(airdropPct));
  const [amountBad, setAmountBad] = useState(false);
  const [pctBad, setPctBad] = useState(false);

  useEffect(() => {
    const num = Number(amount);
    if (amount === "" || !Number.isFinite(num) || num < 0) {
      setAmountBad(amount.length > 0);
      return;
    }
    setAmountBad(false);
    const next = num * UNIT_MULT[unit];
    if (next !== fdv) setFdv(next);
  }, [amount, unit]);

  useEffect(() => {
    const num = Number(pctRaw);
    if (pctRaw === "" || !Number.isFinite(num) || num < 0) {
      setPctBad(pctRaw.length > 0);
      return;
    }
    setPctBad(false);
    if (num !== airdropPct) setAirdropPct(num);
  }, [pctRaw]);

  return (
    <div className="bg-base-panel/60 border border-base-border rounded-2xl p-6 space-y-5">
      <div>
        <label className="uppercase text-xs tracking-widest text-base-mute">
          Fully-diluted valuation
        </label>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 flex items-center bg-base-bg border border-base-border rounded-lg focus-within:border-base-blue transition-colors">
            <span className="pl-4 pr-2 text-base-mute font-mono">$</span>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="5"
              className={`flex-1 bg-transparent py-3 pr-4 font-mono text-lg outline-none ${amountBad ? "text-base-red" : "text-base-text"}`}
            />
          </div>
          <div className="flex bg-base-bg border border-base-border rounded-lg overflow-hidden">
            {(["M", "B"] as Unit[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={`px-4 py-3 font-mono text-sm transition-colors ${unit === u ? "bg-base-blue text-white" : "text-base-mute hover:text-base-text"}`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="uppercase text-xs tracking-widest text-base-mute">
          % of supply allocated to airdrop
        </label>
        <div className="mt-2 flex items-center bg-base-bg border border-base-border rounded-lg focus-within:border-base-blue transition-colors">
          <input
            type="text"
            inputMode="decimal"
            value={pctRaw}
            onChange={(e) => setPctRaw(e.target.value)}
            placeholder="11.62"
            className={`flex-1 bg-transparent pl-4 py-3 font-mono text-lg outline-none ${pctBad ? "text-base-red" : "text-base-text"}`}
          />
          <span className="pr-4 pl-2 text-base-mute font-mono">%</span>
        </div>
      </div>
    </div>
  );
}
