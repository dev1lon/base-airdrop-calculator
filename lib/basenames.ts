import { createPublicClient, http, namehash, keccak256, toHex, encodePacked } from "viem";
import { base } from "viem/chains";

const L2_RESOLVER = "0xC6d566A56A1aFf6508b41f6c90ff131615583BCD" as const;

const RESOLVER_ABI = [
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "node", type: "bytes32" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "addr",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "node", type: "bytes32" }],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

const client = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL || "https://mainnet.base.org"),
});

function reverseNode(address: string): `0x${string}` {
  const addr = address.toLowerCase().replace(/^0x/, "");
  const labelHash = keccak256(toHex(addr));
  const baseReverseRoot = namehash("80002105.reverse");
  return keccak256(encodePacked(["bytes32", "bytes32"], [baseReverseRoot, labelHash]));
}

export async function lookupBaseName(address: string): Promise<string | null> {
  try {
    const node = reverseNode(address);
    const name = (await client.readContract({
      address: L2_RESOLVER,
      abi: RESOLVER_ABI,
      functionName: "name",
      args: [node],
    })) as string;
    if (!name) return null;
    const forward = (await client.readContract({
      address: L2_RESOLVER,
      abi: RESOLVER_ABI,
      functionName: "addr",
      args: [namehash(name)],
    })) as string;
    if (forward && forward.toLowerCase() === address.toLowerCase()) {
      return name;
    }
    return null;
  } catch {
    return null;
  }
}

export async function resolveBaseName(name: string): Promise<string | null> {
  try {
    const addr = (await client.readContract({
      address: L2_RESOLVER,
      abi: RESOLVER_ABI,
      functionName: "addr",
      args: [namehash(name)],
    })) as string;
    if (addr && addr !== "0x0000000000000000000000000000000000000000") return addr;
    return null;
  } catch {
    return null;
  }
}
