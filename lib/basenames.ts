import { createPublicClient, http, namehash, keccak256, toHex, encodePacked } from "viem";
import { base } from "viem/chains";

const REGISTRY = "0xb94704422c2a1e396835a571837aa5ae53285a95" as const;
const REVERSE_REGISTRAR = "0x79ea96012eea67a83431f1701b3dff7e37f9e282" as const;
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

const REVERSE_REGISTRAR_ABI = [
  {
    name: "nameForAddr",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "addr", type: "address" }],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

const client = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL || "https://mainnet.base.org"),
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
  } catch {
    return null;
  }
}

export async function lookupBaseName(address: string): Promise<string | null> {
  try {
    let name: string | null = null;
    try {
      name = (await withTimeout(
        client.readContract({
          address: REVERSE_REGISTRAR,
          abi: REVERSE_REGISTRAR_ABI,
          functionName: "nameForAddr",
          args: [address as `0x${string}`],
        }),
        8000
      )) as string;
    } catch {
      name = null;
    }

    if (!name) {
      const node = reverseNode(address);
      const resolver = await getResolver(node);
      if (!resolver) return null;
      name = (await withTimeout(
        client.readContract({
          address: resolver,
          abi: RESOLVER_ABI,
          functionName: "name",
          args: [node],
        }),
        8000
      )) as string;
    }

    if (!name) return null;

    const forward = await resolveBaseName(name);
    if (forward && forward.toLowerCase() === address.toLowerCase()) return name;
    return null;
  } catch {
    return null;
  }
}
