const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function getClientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "anonymous";
}

export function rateLimit(ip: string): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    if (buckets.size > 1000) {
      for (const [key, b] of buckets) {
        if (b.resetAt < now) buckets.delete(key);
      }
    }
    return { ok: true, retryAfterMs: 0 };
  }
  if (bucket.count >= MAX_REQUESTS) {
    return { ok: false, retryAfterMs: bucket.resetAt - now };
  }
  bucket.count++;
  return { ok: true, retryAfterMs: 0 };
}
