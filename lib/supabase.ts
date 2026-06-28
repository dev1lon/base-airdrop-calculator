import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yhhzqdodhsmmmdgisoxf.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloaHpxZG9kaHNtbW1kZ2lzb3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMTU0NjAsImV4cCI6MjA5NDc5MTQ2MH0.tM6OF-a_rhFfnFzAncXKbjawklKQA_lhcgBVegQ7Ij0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

// A stable per-browser id (random UUID kept in localStorage). It links every
// wallet a person checks from the same device, so we can count how many wallets
// one person looked up. Survives across sessions; resets only if the user
// clears storage or switches browser/device.
const CLIENT_ID_KEY = "bac_client_id";

function getClientId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id =
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

export async function logCheck(
  wallet: string,
  score: number,
  coinsValue: number,
  usdValue: number
): Promise<void> {
  try {
    const { error } = await supabase.from("checks").insert([
      {
        wallet,
        score,
        coins_value: Math.round(coinsValue),
        usd_value: Math.round(usdValue),
        client_id: getClientId(),
      },
    ]);
    if (error) {
      console.error("[supabase] logCheck failed", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
    }
  } catch (e) {
    console.error("[supabase] logCheck threw:", e);
  }
}

export async function getCheckCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("checks")
      .select("*", { count: "exact", head: true });
    if (error) {
      console.error("[supabase] getCheckCount:", error.message);
      return 0;
    }
    return count ?? 0;
  } catch (e) {
    console.error("[supabase] getCheckCount threw:", e);
    return 0;
  }
}
