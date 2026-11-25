import type { FxProviderCredentials } from "libfx";
import { type Auth, json, limited, readAuth, sameOrigin, writeAuth } from "@/lib/server/session";

// The model proxy. The page's libfx sends each model request here instead of to the provider; this route adds the
// signed-in user's credentials from the sealed cookie and forwards it to one of a fixed set of endpoints.
//
// Safety: it never uses a credential of its own (no AI_GATEWAY_API_KEY, no Vercel OIDC token), so nothing runs on
// this deployment's bill. It refuses without a signed-in user, forwards only to the exact endpoints libfx calls for
// that provider, never forwards cookies or Vercel headers, caps the body, and never logs a token.

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_BODY = 8 * 1024 * 1024;

const ENDPOINTS: Record<Auth["provider"], { POST: string[]; GET: string[] }> = {
  vercel: {
    POST: [
      "https://ai-gateway.vercel.sh/v4/ai/language-model",
      "https://ai-gateway.vercel.sh/v3/ai/language-model",
    ],
    GET: ["https://ai-gateway.vercel.sh/coding-agent/v1/models"],
  },
  chatgpt: {
    POST: ["https://chatgpt.com/backend-api/codex/responses"],
    GET: ["https://chatgpt.com/backend-api/codex/models"],
  },
  grok: {
    POST: ["https://cli-chat-proxy.grok.com/v1/responses"],
    GET: ["https://cli-chat-proxy.grok.com/v1/models", "https://api.x.ai/v1/language-models"],
  },
};

// Public client-version lookups libfx makes for Codex and Grok. Forwarded as GETs with no credentials at all.
const PUBLIC: Record<Auth["provider"], string[]> = {
  vercel: [],
  chatgpt: ["https://registry.npmjs.org/@openai/codex/latest"],
  grok: ["https://x.ai/cli/stable"],
};

// Headers libfx sets that the provider needs. Anything else, credentials included, is dropped.
const DROP = new Set([
  "authorization",
  "cookie",
  "host",
  "origin",
  "referer",
  "connection",
  "content-length",
  "accept-encoding",
  "chatgpt-account-id",
  "x-grok-user-id",
  "x-userid",
]);

async function boundedBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) return undefined;
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

const refresher = (provider: "chatgpt" | "grok") =>
  provider === "chatgpt" ? import("libfx/chatgpt") : import("libfx/grok");

async function refreshed(auth: Extract<Auth, { credentials: FxProviderCredentials }>) {
  const credentials = await (await refresher(auth.provider)).refreshCredentials(auth.credentials);
  await writeAuth({ provider: auth.provider, credentials });
  return credentials;
}

function authorize(headers: Headers, auth: Auth, endpoint: string, credentials?: FxProviderCredentials) {
  if (auth.provider === "vercel") {
    headers.set("authorization", `Bearer ${auth.apiKey}`);
    return;
  }
  const { accessToken, accountId } = credentials ?? auth.credentials;
  headers.set("authorization", `Bearer ${accessToken}`);
  if (!accountId) return;
  if (auth.provider === "chatgpt") headers.set("chatgpt-account-id", accountId);
  else if (endpoint.endsWith("/v1/responses")) headers.set("x-grok-user-id", accountId);
  else if (endpoint.endsWith("/v1/models")) headers.set("x-userid", accountId);
}

async function forward(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Not found" }, 404);
  const limit = limited(request, "model", 240);
  if (limit) return limit;

  const auth = await readAuth();
  if (!auth) return json({ error: "Sign in first." }, 401);
  if (auth.provider === "vercel" && Date.now() > auth.expiresAt)
    return json({ error: "Your session expired. Sign in again." }, 401);

  let target: URL;
  try {
    target = new URL(request.headers.get("x-fx-target") ?? "");
  } catch {
    return json({ error: "Unknown model endpoint." }, 400);
  }
  const method = request.method as "GET" | "POST";
  const endpoint = `${target.origin}${target.pathname}`;
  if (method === "GET" && PUBLIC[auth.provider].includes(target.toString())) {
    const upstream = await fetch(target, {
      headers: { accept: "application/json" },
      redirect: "error",
      signal: request.signal,
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/json",
        "cache-control": "no-store",
      },
    });
  }
  const allowed = ENDPOINTS[auth.provider][method] ?? [];
  if (
    !allowed.includes(endpoint) ||
    target.username ||
    target.password ||
    (method === "POST" && target.search)
  ) {
    return json({ error: "Unknown model endpoint." }, 400);
  }

  const headers = new Headers();
  try {
    const passed = JSON.parse(request.headers.get("x-fx-headers") ?? "{}") as Record<string, string>;
    for (const [name, value] of Object.entries(passed)) {
      const lower = name.toLowerCase();
      if (
        !DROP.has(lower) &&
        !lower.startsWith("x-vercel") &&
        !lower.startsWith("x-forwarded") &&
        typeof value === "string"
      ) {
        headers.set(lower, value);
      }
    }
  } catch {
    return json({ error: "Bad request." }, 400);
  }

  const body = method === "POST" ? await boundedBody(request) : undefined;
  if (body === null) return json({ error: "The request is too large." }, 413);

  let credentials = "credentials" in auth ? auth.credentials : undefined;
  if (credentials?.refreshToken && credentials.expiresAt && credentials.expiresAt - 5 * 60_000 < Date.now()) {
    try {
      credentials = await refreshed(auth as Extract<Auth, { credentials: FxProviderCredentials }>);
    } catch {
      return json({ error: "Your session expired. Sign in again." }, 401);
    }
  }

  const send = (with_: FxProviderCredentials | undefined) => {
    const outgoing = new Headers(headers);
    authorize(outgoing, auth, endpoint, with_);
    return fetch(target, { method, headers: outgoing, body, redirect: "error", signal: request.signal });
  };

  let upstream = await send(credentials);
  if (upstream.status === 401 && credentials?.refreshToken) {
    await upstream.body?.cancel();
    try {
      credentials = await refreshed(auth as Extract<Auth, { credentials: FxProviderCredentials }>);
      upstream = await send(credentials);
    } catch {
      return json({ error: "Your session expired. Sign in again." }, 401);
    }
  }

  const out = new Headers({ "cache-control": "no-store" });
  for (const name of ["content-type", "x-request-id", "x-generation-id"]) {
    const value = upstream.headers.get(name);
    if (value) out.set(name, value);
  }
  if (upstream.status < 400) return new Response(upstream.body, { status: upstream.status, headers: out });

  // An error body could quote the credential back; mask every secret before it reaches the page.
  let text = (await upstream.text()).slice(0, 64 * 1024);
  const secrets =
    auth.provider === "vercel"
      ? [auth.apiKey]
      : [credentials?.accessToken, credentials?.refreshToken].filter((value): value is string =>
          Boolean(value),
        );
  for (const secret of secrets) text = text.split(secret).join("*".repeat(8));
  return new Response(text, { status: upstream.status, headers: out });
}

export const POST = forward;
export const GET = forward;
