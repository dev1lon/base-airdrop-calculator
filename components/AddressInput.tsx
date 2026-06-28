"use client";

import { useEffect, useState } from "react";

type Props = {
  onSubmit: (address: string) => void;
  loading: boolean;
  value?: string;
};

export function AddressInput({ onSubmit, loading, value: external }: Props) {
  const [value, setValue] = useState(external ?? "");
  // Keep the field in sync when a wallet connects (parent passes its address).
  useEffect(() => {
    if (external) setValue(external);
  }, [external]);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const v = value.trim();
        if (v) onSubmit(v);
      }}
      className="flex flex-col sm:flex-row gap-3"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="0x... or yourname.base.eth"
        className="flex-1 bg-base-panel border border-base-border rounded-full px-5 py-3 text-sm font-mono outline-none focus:border-base-blue transition-colors"
      />
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="bg-base-blue hover:bg-base-blueHover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold tracking-wide rounded-full px-6 py-3 text-sm transition-colors"
      >
        {loading ? "CHECKING..." : "CHECK ELIGIBILITY"}
      </button>
    </form>
  );
}
