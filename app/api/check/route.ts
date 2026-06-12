import { NextResponse } from "next/server";
import { checkAddress } from "@/lib/check";
import type { CheckResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_TTL_MS = 5 * 60 * 1000;
const PROXY_TIMEOUT_MS = 55_000;
const SECRET_HEADER = "x-check-api-secret";

type CacheEntry = {
  at: number;
  response: CheckResponse;
};

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<CheckResponse>>();

function keyFor(input: string): string {
  return input.trim().toLowerCase();
}

function json(response: CheckResponse, status = 200) {
  return NextResponse.json(response, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function getProxyTarget(): string | null {
  const raw = process.env.CHECK_API_URL?.trim();
  if (!raw) return null;

  const url = new URL(raw);
  const path = url.pathname.replace(/\/+$/, "");
  url.pathname = path.endsWith("/api/check")
    ? `${path}/`
    : `${path || ""}/api/check/`;
  url.search = "";
  return url.toString();
}

async function proxyCheck(input: string, target: string): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PROXY_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const secret = process.env.CHECK_API_SECRET?.trim();
    if (secret) headers[SECRET_HEADER] = secret;

    const response = await fetch(target, {
      method: "POST",
      headers,
      body: JSON.stringify({ address: input }),
      cache: "no-store",
      signal: ctrl.signal,
    });

    return new NextResponse(await response.text(), {
      status: response.status,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": response.headers.get("content-type") || "application/json",
      },
    });
  } catch (e) {
    console.error("[check proxy]", e);
    return json({ ok: false, error: "Check backend unavailable" }, 502);
  } finally {
    clearTimeout(timer);
  }
}

function isAuthorized(request: Request): boolean {
  const secret = process.env.CHECK_API_SECRET?.trim();
  if (!secret) return true;
  return request.headers.get(SECRET_HEADER) === secret;
}

export async function POST(request: Request) {
  let input = "";

  try {
    const body = (await request.json()) as { address?: unknown };
    input = typeof body.address === "string" ? body.address : "";
  } catch {
    return json({ ok: false, error: "Invalid request" }, 400);
  }

  const key = keyFor(input);
  if (!key) return json({ ok: false, error: "Missing address" }, 400);

  let proxyTarget: string | null = null;
  try {
    proxyTarget = getProxyTarget();
  } catch (e) {
    console.error("[check proxy config]", e);
    return json({ ok: false, error: "Check backend misconfigured" }, 500);
  }

  if (proxyTarget) {
    return proxyCheck(input, proxyTarget);
  }

  if (!isAuthorized(request)) {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }

  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return json(cached.response);
  }

  let check = inflight.get(key);
  if (!check) {
    check = checkAddress(input);
    inflight.set(key, check);
  }

  try {
    const response = await check;
    if (response.ok) {
      cache.set(key, { at: Date.now(), response });
    }
    return json(response, response.ok ? 200 : 400);
  } finally {
    if (inflight.get(key) === check) {
      inflight.delete(key);
    }
  }
}
