"use client";

import { useEffect, useState } from "react";

type Props = {
  fdv: number;
  setFdv: (v: number) => void;
  airdropPct: number;
  setAirdropPct: (v: number) => void;
  totalSupply: number;
  setTotalSupply: (v: number) => void;
};

type Unit = "M" | "B";
const UNIT_MULT: Record<Unit, number> = { M: 1e6, B: 1e9 };

function splitAmount(n: number): { amount: string; unit: Unit } {
  if (!Number.isFinite(n) || n <= 0) return { amount: "", unit: "B" };
  if (n >= 1e9) return { amount: trim(n / 1e9), unit: "B" };
  return { amount: trim(n / 1e6), unit: "M" };
}

function trim(n: number): string {
  return n.toFixed(4).replace(/\.?0+$/, "");
}

function UnitToggle({
  value,
  onChange,
}: {
  value: Unit;
  onChange: (u: Unit) => void;
}) {
  return (
    <div className="flex bg-base-bg border border-base-border rounded-lg overflow-hidden">
      {(["M", "B"] as Unit[]).map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => onChange(u)}
          className={`px-4 py-3 font-mono text-sm transition-colors ${value === u ? "bg-base-blue text-white" : "text-base-mute hover:text-base-text"}`}
        >
          {u}
        </button>
      ))}
    </div>
  );
}

function AmountRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  const initial = splitAmount(value);
  const [amount, setAmount] = useState(initial.amount);
  const [unit, setUnit] = useState<Unit>(initial.unit);
  const [bad, setBad] = useState(false);

  useEffect(() => {
    const num = Number(amount);
    if (amount === "" || !Number.isFinite(num) || num < 0) {
      setBad(amount.length > 0);
      return;
    }
    setBad(false);
    const next = num * UNIT_MULT[unit];
    if (next !== value) onChange(next);
  }, [amount, unit]);

  return (
    <div>
      <label className="uppercase text-xs tracking-widest text-base-mute">{label}</label>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 flex items-center bg-base-bg border border-base-border rounded-lg focus-within:border-base-blue transition-colors">
          <span className="pl-4 pr-2 text-base-mute font-mono">$</span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="5"
            className={`flex-1 bg-transparent py-3 pr-4 font-mono text-lg outline-none ${bad ? "text-base-red" : "text-base-text"}`}
          />
        </div>
        <UnitToggle value={unit} onChange={setUnit} />
      </div>
    </div>
  );
}

function SupplyRow({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const initial = splitAmount(value);
  const [amount, setAmount] = useState(initial.amount);
  const [unit, setUnit] = useState<Unit>(initial.unit);
  const [bad, setBad] = useState(false);

  useEffect(() => {
    const num = Number(amount);
    if (amount === "" || !Number.isFinite(num) || num <= 0) {
      setBad(amount.length > 0);
      return;
    }
    setBad(false);
    const next = num * UNIT_MULT[unit];
    if (next !== value) onChange(next);
  }, [amount, unit]);

  return (
    <div>
      <label className="uppercase text-xs tracking-widest text-base-mute">Total token supply</label>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 flex items-center bg-base-bg border border-base-border rounded-lg focus-within:border-base-blue transition-colors">
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="10"
            className={`flex-1 bg-transparent pl-4 py-3 pr-4 font-mono text-lg outline-none ${bad ? "text-base-red" : "text-base-text"}`}
          />
        </div>
        <UnitToggle value={unit} onChange={setUnit} />
      </div>
    </div>
  );
}

export function ValuationInputs({
  fdv,
  setFdv,
  airdropPct,
  setAirdropPct,
  totalSupply,
  setTotalSupply,
}: Props) {
  const [pctRaw, setPctRaw] = useState(() => String(airdropPct));
  const [pctBad, setPctBad] = useState(false);

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
      <AmountRow label="Fully-diluted valuation" value={fdv} onChange={setFdv} />

      <SupplyRow value={totalSupply} onChange={setTotalSupply} />

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
