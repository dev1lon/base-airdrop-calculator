"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { AddressInput } from "@/components/AddressInput";
import { EligibilityPanel } from "@/components/EligibilityPanel";
import { CriteriaList } from "@/components/CriteriaList";
import { ValuationInputs } from "@/components/ValuationInputs";
import type { CheckResponse, ConfigResponse, ScoreResult } from "@/lib/types";

const ARB_AIRDROP_PCT = 11.62;

export default function Page() {
  const [config, setConfig] = useState<ConfigResponse | null>(null);

  const [address, setAddress] = useState<string | null>(null);
  const [resolvedFromName, setResolvedFromName] = useState<string | null>(null);
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fdv, setFdv] = useState<number | null>(null);
  const [airdropPct, setAirdropPct] = useState<number | null>(null);
  const [totalSupply, setTotalSupply] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((c: ConfigResponse) => {
        setConfig(c);
        setFdv(c.defaultFdv);
        setAirdropPct(c.defaultAirdropPct);
        setTotalSupply(c.defaultSupply);
      })
      .catch(() => setError("Failed to load config"));
  }, []);

  const baseTokens = score?.baseTokens ?? 0;
  const safePct = airdropPct ?? 0;
  const safeFdv = fdv ?? 0;
  const safeSupply = totalSupply && totalSupply > 0 ? totalSupply : 1;
  const scaledTokens = Math.round((baseTokens * safePct) / ARB_AIRDROP_PCT);
  const userUsd = scaledTokens * (safeFdv / safeSupply);

  async function handleCheck(input: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/check?address=${encodeURIComponent(input)}`);
      const json = (await res.json()) as CheckResponse;
      if (!json.ok) {
        setError(json.error);
      } else {
        setAddress(json.address);
        setResolvedFromName(json.resolvedFromName);
        setScore(json.score);
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

          {config && fdv != null && airdropPct != null && totalSupply != null && (
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
          )}
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
