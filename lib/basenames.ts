import { createPublicClient, http, fallback, namehash, keccak256, toHex, encodePacked } from "viem";
import { base } from "viem/chains";

const REGISTRY = "0xb94704422c2a1e396835a571837aa5ae53285a95" as const;
const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

const REGISTRY_ABI = [
  {
    name: "resolver",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "node", type: "bytes32" }],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

const RESOLVER_ABI = [
  {
    name: "addr",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "node", type: "bytes32" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "node", type: "bytes32" }],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

const RPC_URLS = [
  // Primary: dedicated Alchemy key (most reliable for contract reads under load)
  "https://base-mainnet.g.alchemy.com/v2/BsnOewsk2kTINICMWjojp",
  // Public fallbacks
  "https://base-rpc.publicnode.com",
  "https://base.drpc.org",
  "https://rpc.ankr.com/base",
  "https://base.llamarpc.com",
  "https://mainnet.base.org",
];

const client = createPublicClient({
  chain: base,
  transport: fallback(
    RPC_URLS.map((url) => http(url, { timeout: 6_000, retryCount: 0 })),
    { rank: false, retryCount: 1 }
  ),
});

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

function reverseNode(address: string): `0x${string}` {
  const addr = address.toLowerCase().replace(/^0x/, "");
  const labelHash = keccak256(toHex(addr));
  const baseReverseRoot = namehash("80002105.reverse");
  return keccak256(encodePacked(["bytes32", "bytes32"], [baseReverseRoot, labelHash]));
}

async function getResolver(node: `0x${string}`): Promise<`0x${string}` | null> {
  const resolver = (await withTimeout(
    client.readContract({
      address: REGISTRY,
      abi: REGISTRY_ABI,
      functionName: "resolver",
      args: [node],
    }),
    8000
  )) as `0x${string}`;
  if (!resolver || resolver.toLowerCase() === ZERO_ADDR) return null;
  return resolver;
}

export async function resolveBaseName(name: string): Promise<string | null> {
  try {
    const node = namehash(name);
    const resolver = await getResolver(node);
    if (!resolver) return null;
    const addr = (await withTimeout(
      client.readContract({
        address: resolver,
        abi: RESOLVER_ABI,
        functionName: "addr",
        args: [node],
      }),
      8000
    )) as string;
    if (!addr || addr.toLowerCase() === ZERO_ADDR) return null;
    return addr;
  } catch (e) {
    console.error("[resolveBaseName]", name, e instanceof Error ? e.message : e);
    return null;
  }
}

export async function lookupBaseName(address: string): Promise<string | null> {
  try {
    const node = reverseNode(address);
    const resolver = await getResolver(node);
    if (!resolver) {
      console.error("[lookupBaseName] no resolver for reverse node of", address);
      return null;
    }
    const name = (await withTimeout(
      client.readContract({
        address: resolver,
        abi: RESOLVER_ABI,
        functionName: "name",
        args: [node],
      }),
      8000
    )) as string;
    if (!name) {
      console.error("[lookupBaseName] empty name from resolver for", address);
      return null;
    }

    const forward = await resolveBaseName(name);
    if (forward && forward.toLowerCase() === address.toLowerCase()) return name;
    console.error("[lookupBaseName] forward mismatch", { address, name, forward });
    return null;
  } catch (e) {
    console.error("[lookupBaseName]", address, e instanceof Error ? e.message : e);
    return null;
  }
}
