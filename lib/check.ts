import { isAddress } from "viem";
import { analyzeAddress } from "./analyze";
import { resolveBaseName } from "./basenames";
import { score } from "./scoring";
import type { CheckResponse } from "./types";

export async function checkAddress(raw: string): Promise<CheckResponse> {
  const trimmed = (raw || "").trim();
  if (!trimmed) return { ok: false, error: "Missing address" };

  let address = trimmed;
  let resolvedFromName: string | null = null;

  if (!isAddress(address)) {
    if (/\.base(\.eth)?$/i.test(address)) {
      const name = address.endsWith(".eth") ? address : `${address}.eth`;
      const resolved = await resolveBaseName(name);
      if (!resolved) {
        return { ok: false, error: "Could not resolve Base Name" };
      }
      address = resolved;
      resolvedFromName = name;
    } else {
      return { ok: false, error: "Invalid address or Base Name" };
    }
  }

  try {
    const stats = await analyzeAddress(address);
    const sc = score(stats);
    return { ok: true, address, resolvedFromName, stats, score: sc };
  } catch (e) {
    console.error("[checkAddress]", e);
    return {
      ok: false,
      error: "Network busy — please try again in a moment",
    };
  }
}
