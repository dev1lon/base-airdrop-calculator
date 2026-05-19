import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yhhzqdodhsmmmdgisoxf.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloaHpxZG9kaHNtbW1kZ2lzb3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMTU0NjAsImV4cCI6MjA5NDc5MTQ2MH0.tM6OF-a_rhFfnFzAncXKbjawklKQA_lhcgBVegQ7Ij0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

export async function logCheck(
  wallet: string,
  score: number,
  estimatedValue: number
): Promise<void> {
  try {
    const { error } = await supabase
      .from("checks")
      .insert([{ wallet, score, estimated_value: estimatedValue }]);
    if (error) console.error("[supabase] logCheck:", error.message);
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
