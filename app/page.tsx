"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { AddressInput } from "@/components/AddressInput";
import { EligibilityPanel } from "@/components/EligibilityPanel";
import { CriteriaList } from "@/components/CriteriaList";
import { ValuationInputs } from "@/components/ValuationInputs";
import { checkAddress } from "@/lib/check";
import {
  ARB_AIRDROP_PCT,
  DEFAULT_AIRDROP_PCT,
  DEFAULT_FDV,
  DEFAULT_SUPPLY,
} from "@/lib/scoring";
import type { ScoreResult } from "@/lib/types";

export default function Page() {
  const [address, setAddress] = useState<string | null>(null);
  const [resolvedFromName, setResolvedFromName] = useState<string | null>(null);
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fdv, setFdv] = useState<number>(DEFAULT_FDV);
  const [airdropPct, setAirdropPct] = useState<number>(DEFAULT_AIRDROP_PCT);
  const [totalSupply, setTotalSupply] = useState<number>(DEFAULT_SUPPLY);

  const baseTokens = score?.baseTokens ?? 0;
  const safeSupply = totalSupply > 0 ? totalSupply : 1;
  const scaledTokens = Math.round((baseTokens * airdropPct) / ARB_AIRDROP_PCT);
  const userUsd = scaledTokens * (fdv / safeSupply);

  async function handleCheck(input: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await checkAddress(input);
      if (!res.ok) {
        setError(res.error);
      } else {
        setAddress(res.address);
        setResolvedFromName(res.resolvedFromName);
        setScore(res.score);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen">
      <Header />

      <div className="mx-auto max-w-6xl px-6 py-10">
        <AddressInput onSubmit={handleCheck} loading={loading} />
        {error && <p className="mt-3 text-sm text-base-red font-mono">{error}</p>}
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 border-t border-base-border/60 pt-12">
        <div>
          <div
            className={`transition-opacity duration-200 ${loading && score ? "opacity-60" : ""}`}
          >
            <EligibilityPanel
              address={address}
              resolvedFromName={resolvedFromName}
              score={score}
              scaledTokens={scaledTokens}
              userUsd={userUsd}
              loading={loading}
            />
          </div>

          <div className="mt-10">
            <ValuationInputs
              fdv={fdv}
              setFdv={setFdv}
              airdropPct={airdropPct}
              setAirdropPct={setAirdropPct}
              totalSupply={totalSupply}
              setTotalSupply={setTotalSupply}
            />
          </div>
        </div>

        <div
          className={`transition-opacity duration-200 ${loading && score ? "opacity-60" : ""}`}
        >
          <CriteriaList score={score} loading={loading && !score} />
        </div>
      </div>

      <footer className="border-t border-base-border/60">
        <div
          className="mx-auto max-w-6xl px-6 py-6 flex flex-col sm:flex-row gap-3 sm:gap-6 items-start sm:items-center justify-between text-base-mute"
          style={{ fontSize: "0.85rem" }}
        >
          <span className="max-w-2xl">
            Hypothetical calculator. Not affiliated with Base, Coinbase, or any
            token issuer. Scoring mirrors the public Arbitrum airdrop
            eligibility specification.
          </span>
          <span className="whitespace-nowrap">
            Created by{" "}
            <a
              href="https://x.com/devilonnn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-base-text hover:text-base-blue transition-colors font-mono"
            >
              @devilonnn
            </a>
          </span>
        </div>
      </footer>
    </main>
  );
}
