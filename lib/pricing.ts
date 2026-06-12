import { supabase } from "./supabase";

type Prices = { eth: number; btc: number };

// Per-browser-session memory cache so a user dragging sliders / re-checking
// doesn't hit Supabase repeatedly.
let mem: Prices = { eth: 0, btc: 0 };
let memAt = 0;

const MEM_TTL_MS = 60_000; // in-tab reuse window
const SHARED_TTL_MS = 120_000; // how long the Supabase-cached price is "fresh"
const FALLBACK: Prices = { eth: 3000, btc: 60000 };

async function fetchCoinGecko(): Promise<Prices | null> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin&vs_currencies=usd"
    );
    const json = (await res.json()) as {
      ethereum?: { usd?: number };
      bitcoin?: { usd?: number };
    };
    const eth = json?.ethereum?.usd;
    const btc = json?.bitcoin?.usd;
    if (typeof eth === "number" && eth > 0 && typeof btc === "number" && btc > 0) {
      return { eth, btc };
    }
  } catch {}
  return null;
}

// Price resolution order, designed so that under heavy traffic CoinGecko is
// hit at most ~once per SHARED_TTL_MS across ALL visitors (not per visitor):
//   1. in-tab memory cache (no network)
//   2. shared Supabase `prices` row, if fresh
//   3. refresh from CoinGecko, write back to Supabase
//   4. stale Supabase row / hardcoded fallback if CoinGecko is down
export async function getPrices(): Promise<Prices> {
  if (Date.now() - memAt < MEM_TTL_MS && mem.eth > 0 && mem.btc > 0) {
    return mem;
  }

  try {
    const { data } = await supabase
      .from("prices")
      .select("eth_usd, btc_usd, updated_at")
      .eq("id", 1)
      .single();

    if (data && data.eth_usd > 0 && data.btc_usd > 0) {
      const age = Date.now() - new Date(data.updated_at).getTime();
      const shared: Prices = { eth: data.eth_usd, btc: data.btc_usd };
      if (age < SHARED_TTL_MS) {
        mem = shared;
        memAt = Date.now();
        return shared;
      }
      // Shared row is stale — this visitor refreshes it for everyone.
      const fresh = await fetchCoinGecko();
      if (fresh) {
        await supabase
          .from("prices")
          .update({
            eth_usd: fresh.eth,
            btc_usd: fresh.btc,
            updated_at: new Date().toISOString(),
          })
          .eq("id", 1);
        mem = fresh;
        memAt = Date.now();
        return fresh;
      }
      // CoinGecko down — use the stale shared price rather than fallback.
      mem = shared;
      memAt = Date.now();
      return shared;
    }
  } catch {}

  // Supabase unreachable / empty — go direct to CoinGecko.
  const fresh = await fetchCoinGecko();
  if (fresh) {
    mem = fresh;
    memAt = Date.now();
    return fresh;
  }
  return mem.eth > 0 ? mem : FALLBACK;
}

export async function getEthPriceUsd(): Promise<number> {
  return (await getPrices()).eth;
}

type Peg = "stable" | "eth" | "btc";

const ASSET_PEG: Record<string, Peg> = {
  // USD stables
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": "stable", // USDC native
  "0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca": "stable", // USDbC (bridged USDC)
  "0xfde4c96c8593536e31f229ea8f37b2ada2699bb2": "stable", // USDT (Tether)
  "0x50c5725949a6f0c72e6c4a641f24049a917db0cb": "stable", // DAI
  "0x9e1028f5f1d5ede59748ffcee5532509976840e0": "stable", // crvUSD
  // ETH-pegged
  "0x4200000000000000000000000000000000000006": "eth", // WETH (predeploy)
  "0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22": "eth", // cbETH
  "0xc1cba3fcea344f92d9239c08c0568f6f2f0ee452": "eth", // wstETH
  "0x04c0599ae5a44757c0af6f9ec3b93da8976c150a": "eth", // weETH
  "0x2416092f143378750bb29b79ed961ab195cceea5": "eth", // ezETH
  // BTC-pegged
  "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf": "btc", // cbBTC
};

export function tokenUsdValue(
  contract: string,
  rawAmount: bigint,
  decimals: number,
  prices: Prices
): number {
  const peg = ASSET_PEG[contract.toLowerCase()];
  if (!peg) return 0;
  const amount = Number(rawAmount) / 10 ** decimals;
  if (peg === "stable") return amount;
  if (peg === "eth") return amount * prices.eth;
  return amount * prices.btc;
}
