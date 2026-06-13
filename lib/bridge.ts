// Reliable canonical-bridge deposit detection via Ankr's Advanced API.
//
// The official Base Bridge delivers an L1->L2 ETH deposit through
// L2CrossDomainMessenger.relayMessage -> L2StandardBridge.finalizeBridgeETH,
// which credits the user via a nested internal call that no free indexer
// (Blockscout / Alchemy getAssetTransfers) reliably exposes. The one durable
// footprint is the `ETHBridgeFinalized(from, to, amount, extraData)` event on
// the L2StandardBridge. Public-RPC `eth_getLogs` caps the block range (~10k),
// but Ankr's `ankr_getLogs` scans the full history in a single paginated call.

const ANKR_KEY = "aa28857240e2e0c174f41020168f4574e42437b8f1157d709ea18dd430b6ade1";
const ANKR_URL = `https://rpc.ankr.com/multichain/${ANKR_KEY}`;
const L2_STANDARD_BRIDGE = "0x4200000000000000000000000000000000000010";
// keccak256("ETHBridgeFinalized(address,address,uint256,bytes)")
const ETH_BRIDGE_FINALIZED =
  "0x31b2166ff604fc5672ea5df08a78081d2bc6d746cadce880747f3643d819e83d";
const TIMEOUT_MS = 12_000;

function toTopic(address: string): string {
  return "0x000000000000000000000000" + address.toLowerCase().replace(/^0x/, "");
}

type AnkrLog = { data?: string };

export type BridgeResult = { hasBridged: boolean; ethWei: bigint };

// Returns whether the address received any canonical Base Bridge ETH deposit
// and the total ETH (wei) bridged. Best-effort: on any failure returns a
// negative-unknown result so the caller can fall back to other signals.
export async function getCanonicalBridge(
  address: string
): Promise<BridgeResult | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(ANKR_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "ankr_getLogs",
        params: {
          blockchain: "base",
          address: [L2_STANDARD_BRIDGE],
          topics: [[ETH_BRIDGE_FINALIZED], [], [toTopic(address)]],
          fromBlock: "earliest",
          toBlock: "latest",
        },
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      result?: { logs?: AnkrLog[] };
      error?: unknown;
    };
    if (json.error || !json.result) return null;

    const logs = json.result.logs ?? [];
    let ethWei = 0n;
    for (const log of logs) {
      // data layout: [amount (32 bytes)][extraData offset][...]; amount first.
      const word = log.data?.slice(2, 66);
      if (word) {
        try {
          ethWei += BigInt("0x" + word);
        } catch {}
      }
    }
    return { hasBridged: logs.length > 0, ethWei };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
