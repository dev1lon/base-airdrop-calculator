let cachedEthPrice = 0;
let cachedAt = 0;
const TTL_MS = 60_000;

export async function getEthPriceUsd(): Promise<number> {
  if (Date.now() - cachedAt < TTL_MS && cachedEthPrice > 0) {
    return cachedEthPrice;
  }
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
      { next: { revalidate: 60 } }
    );
    const json = (await res.json()) as { ethereum?: { usd?: number } };
    const price = json?.ethereum?.usd;
    if (typeof price === "number" && price > 0) {
      cachedEthPrice = price;
      cachedAt = Date.now();
      return price;
    }
  } catch {}
  return cachedEthPrice || 3000;
}

const STABLES: Record<string, number> = {
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": 1,
  "0xfde4c96c8593536e31f229ea8f37b2ada2699bb2": 1,
  "0x50c5725949a6f0c72e6c4a641f24049a917db0cb": 1,
  "0x4200000000000000000000000000000000000006": -1,
};

export function tokenUsdValue(
  contract: string,
  rawAmount: bigint,
  decimals: number,
  ethPriceUsd: number
): number {
  const key = contract.toLowerCase();
  const price = STABLES[key];
  if (price === undefined) return 0;
  const amount = Number(rawAmount) / 10 ** decimals;
  if (price === -1) return amount * ethPriceUsd;
  return amount * price;
}
