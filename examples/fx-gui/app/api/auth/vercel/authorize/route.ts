import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { limited, writePending } from "@/lib/server/session";

// Sign in with Vercel (OAuth 2.0 with PKCE). The app asks for the "AI Gateway API Keys" team permission, so the
// callback can make an AI Gateway key on the user's own team, billed to them.
export async function GET(request: Request) {
  const limit = limited(request, "vercel-authorize", 10);
  if (limit) return limit;
  const clientId = process.env.VERCEL_APP_CLIENT_ID;
  if (!clientId) return NextResponse.redirect(new URL("/?signin_error=vercel-unconfigured", request.url));
  const state = randomBytes(16).toString("base64url");
  const nonce = randomBytes(16).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  await writePending({ provider: "vercel", state, nonce, verifier });
  const url = new URL("https://vercel.com/oauth/authorize");
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: new URL("/api/auth/vercel/callback", request.url).toString(),
    response_type: "code",
    scope: "openid",
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
  }).toString();
  return NextResponse.redirect(url);
}
