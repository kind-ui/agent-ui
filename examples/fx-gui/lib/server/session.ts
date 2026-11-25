import type { FxProviderCredentials } from "libfx";
import { NextResponse } from "next/server";
import { clearSealed, readSealed, writeSealed } from "./cookie";

export type Provider = "vercel" | "chatgpt" | "grok";

/** What the auth cookie holds. Never sent to the page. */
export type Auth =
  | {
      provider: "vercel";
      apiKey: string;
      keyId: string;
      teamId: string;
      accessToken: string;
      expiresAt: number;
    }
  | { provider: "chatgpt" | "grok"; credentials: FxProviderCredentials };

export const AUTH = "fx_auth";
export const PENDING = "fx_pending";
const WEEK = 60 * 60 * 24 * 7;

export const readAuth = () => readSealed<Auth>(AUTH);
export const writeAuth = (auth: Auth) => writeSealed(AUTH, auth, WEEK);
export const clearAuth = () => clearSealed(AUTH);

export const readPending = <T>() => readSealed<T>(PENDING);
export const writePending = (value: unknown) => writeSealed(PENDING, value, 60 * 20);
export const clearPending = () => clearSealed(PENDING);

// A per-instance limiter: enough to slow a script down in a spike. Keyed by client address.
const hits = new Map<string, number[]>();

export function limited(request: Request, bucket: string, max: number, windowMs = 60_000) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const id = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(id) ?? []).filter((time) => now - time < windowMs);
  recent.push(now);
  hits.set(id, recent);
  if (hits.size > 10_000) hits.clear();
  return recent.length > max
    ? NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 })
    : null;
}

/**
 * CSRF guard for the page's own requests: the Origin must be this site, and the request carries a custom header,
 * which a cross-site form or a simple request can't add without a CORS preflight this site never allows.
 */
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return (!origin || origin === new URL(request.url).origin) && request.headers.get("x-fx-gui") === "1";
}

export const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
