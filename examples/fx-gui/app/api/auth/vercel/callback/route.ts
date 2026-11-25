import { NextResponse } from "next/server";
import { clearPending, limited, readPending, writeAuth } from "@/lib/server/session";

type Pending = { provider: "vercel"; state: string; verifier: string };
const KEY_LIFETIME = 7 * 24 * 60 * 60 * 1000;

const fail = (request: Request, reason: string) =>
  NextResponse.redirect(new URL(`/?signin_error=${encodeURIComponent(reason)}`, request.url));

async function teamOf(token: string, tokens: Record<string, unknown>) {
  if (typeof tokens.team_id === "string") return tokens.team_id;
  const response = await fetch("https://api.vercel.com/v2/teams?limit=1", {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  const body = (await response.json()) as { teams?: { id: string }[] };
  return body.teams?.[0]?.id ?? null;
}

export async function GET(request: Request) {
  const limit = limited(request, "vercel-callback", 10);
  if (limit) return limit;
  const url = new URL(request.url);
  const pending = await readPending<Pending>();
  await clearPending();
  if (url.searchParams.get("error")) return fail(request, "vercel-denied");
  if (!pending || pending.provider !== "vercel" || pending.state !== url.searchParams.get("state")) {
    return fail(request, "vercel-state");
  }
  const tokenResponse = await fetch("https://api.vercel.com/login/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.VERCEL_APP_CLIENT_ID ?? "",
      client_secret: process.env.VERCEL_APP_CLIENT_SECRET ?? "",
      code: url.searchParams.get("code") ?? "",
      code_verifier: pending.verifier,
      redirect_uri: new URL("/api/auth/vercel/callback", request.url).toString(),
    }),
  });
  if (!tokenResponse.ok) return fail(request, "vercel-token");
  const tokens = (await tokenResponse.json()) as Record<string, unknown>;
  const accessToken = String(tokens.access_token ?? "");
  const teamId = await teamOf(accessToken, tokens);
  if (!teamId) return fail(request, "vercel-team");

  // A key on the user's team, so AI Gateway bills them. It expires on its own, and Sign out deletes it.
  const expiresAt = Date.now() + KEY_LIFETIME;
  const keyResponse = await fetch(`https://api.vercel.com/v1/api-keys?teamId=${encodeURIComponent(teamId)}`, {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
    body: JSON.stringify({ purpose: "ai-gateway", name: "fx-gui", expiresAt }),
  });
  if (!keyResponse.ok) return fail(request, `vercel-key-${keyResponse.status}`);
  const key = (await keyResponse.json()) as { apiKeyString?: string; id?: string; apiKey?: { id?: string } };
  if (!key.apiKeyString) return fail(request, "vercel-key");
  await writeAuth({
    provider: "vercel",
    apiKey: key.apiKeyString,
    keyId: key.id ?? key.apiKey?.id ?? "",
    teamId,
    accessToken,
    expiresAt,
  });
  return NextResponse.redirect(new URL("/", request.url));
}
