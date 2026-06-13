import { baseClient } from "./basenames";

// "Early-user" NFT criteria. Holding either of these well-known Base
// collections grants one airdrop point each (like the Base Name criterion).
// Both are standard ERC-721s, so a non-zero balanceOf means the wallet holds
// at least one token.
export const EARLY_USER_NFTS = {
  betaAccess: "0xe3eb165c9ed6d6d87a59c410c8f30babac44fefd",
  baseBuilder: "0x8dc80a209a3362f0586e6c116973bb6908170c84",
} as const;

const ERC721_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export type EarlyUserNfts = { betaAccess: boolean; baseBuilder: boolean };

async function holdsNft(contract: string, owner: string): Promise<boolean> {
  try {
    const bal = (await baseClient.readContract({
      address: contract as `0x${string}`,
      abi: ERC721_ABI,
      functionName: "balanceOf",
      args: [owner as `0x${string}`],
    })) as bigint;
    return bal > 0n;
  } catch (e) {
    console.error("[holdsNft]", contract, e instanceof Error ? e.message : e);
    return false;
  }
}

// Best-effort: a failed RPC read returns false (the criterion shows unmet)
// rather than failing the whole check, matching how Base Name detection
// degrades. Runs against the shared RPC fallback, not Blockscout, so it adds
// no load to the rate-limited explorer API.
export async function getEarlyUserNfts(address: string): Promise<EarlyUserNfts> {
  const [betaAccess, baseBuilder] = await Promise.all([
    holdsNft(EARLY_USER_NFTS.betaAccess, address),
    holdsNft(EARLY_USER_NFTS.baseBuilder, address),
  ]);
  return { betaAccess, baseBuilder };
}
