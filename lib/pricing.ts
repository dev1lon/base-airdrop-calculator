type Prices = { eth: number; btc: number };
let cached: Prices = { eth: 0, btc: 0 };
let cachedAt = 0;
const TTL_MS = 60_000;
const FALLBACK: Prices = { eth: 3000, btc: 60000 };

export async function getPrices(): Promise<Prices> {
  if (Date.now() - cachedAt < TTL_MS && cached.eth > 0 && cached.btc > 0) {
    return cached;
  }
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin&vs_currencies=usd",
      { next: { revalidate: 60 } }
    );
    const json = (await res.json()) as {
      ethereum?: { usd?: number };
      bitcoin?: { usd?: number };
    };
    const eth = json?.ethereum?.usd;
    const btc = json?.bitcoin?.usd;
    if (typeof eth === "number" && eth > 0 && typeof btc === "number" && btc > 0) {
      cached = { eth, btc };
      cachedAt = Date.now();
      return cached;
    }
  } catch {}
  if (cached.eth > 0 && cached.btc > 0) return cached;
  return FALLBACK;
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
