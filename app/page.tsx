"use client";

import { useEffect, useRef, useState } from "react";
import { Header } from "@/components/Header";
import { AddressInput } from "@/components/AddressInput";
import { EligibilityPanel } from "@/components/EligibilityPanel";
import { CriteriaList } from "@/components/CriteriaList";
import { ValuationInputs } from "@/components/ValuationInputs";
import type {
  CheckResponse,
  ConfigResponse,
  ScoreResult,
  ValuationResponse,
} from "@/lib/types";

export default function Page() {
  const [config, setConfig] = useState<ConfigResponse | null>(null);

  const [address, setAddress] = useState<string | null>(null);
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fdv, setFdv] = useState<number | null>(null);
  const [airdropPct, setAirdropPct] = useState<number | null>(null);
  const [totalSupply, setTotalSupply] = useState<number | null>(null);

  const [scaledTokens, setScaledTokens] = useState(0);
  const [userUsd, setUserUsd] = useState(0);

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

  const valueAbort = useRef<AbortController | null>(null);
  const valueTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!score || fdv == null || airdropPct == null || totalSupply == null) {
      setScaledTokens(0);
      setUserUsd(0);
      return;
    }
    if (valueTimer.current) clearTimeout(valueTimer.current);
    valueTimer.current = setTimeout(() => {
      valueAbort.current?.abort();
      const ctrl = new AbortController();
      valueAbort.current = ctrl;
      const url = `/api/value?baseTokens=${score.baseTokens}&fdv=${fdv}&airdropPct=${airdropPct}&totalSupply=${totalSupply}`;
      fetch(url, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((j: ValuationResponse) => {
          setScaledTokens(j.valuation.scaledTokens);
          setUserUsd(j.valuation.userUsd);
        })
        .catch(() => {});
    }, 120);
    return () => {
      if (valueTimer.current) clearTimeout(valueTimer.current);
    };
  }, [score, fdv, airdropPct, totalSupply]);

  async function handleCheck(input: string) {
    setLoading(true);
    setError(null);
    setScore(null);
    try {
      const res = await fetch(`/api/check?address=${encodeURIComponent(input)}`);
      const json = (await res.json()) as CheckResponse;
      if (!json.ok) {
        setError(json.error);
        setAddress(null);
      } else {
        setAddress(json.address);
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
          <EligibilityPanel
            address={address}
            score={score}
            scaledTokens={scaledTokens}
            userUsd={userUsd}
            loading={loading}
          />

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

        <div>
          <CriteriaList score={score} loading={loading} />
        </div>
      </div>

      <footer className="border-t border-base-border/60">
        <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-base-mute">
          Hypothetical calculator. Not affiliated with Base, Coinbase, or any
          token issuer. Scoring rubric mirrors the public Arbitrum airdrop
          eligibility specification.
        </div>
      </footer>
    </main>
  );
}
