import { clearAuth, clearPending, json, readAuth, sameOrigin } from "@/lib/server/session";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Not found" }, 404);
  const auth = await readAuth();
  if (auth?.provider === "vercel") {
    // Delete the AI Gateway key made for this site, then revoke the Vercel token. Best effort: the cookie goes either way.
    await fetch(
      `https://api.vercel.com/v1/api-keys/${encodeURIComponent(auth.keyId)}?teamId=${encodeURIComponent(auth.teamId)}`,
      {
        method: "DELETE",
        headers: { authorization: `Bearer ${auth.accessToken}` },
      },
    ).catch(() => {});
    const body = new URLSearchParams({
      token: auth.accessToken,
      client_id: process.env.VERCEL_APP_CLIENT_ID ?? "",
      client_secret: process.env.VERCEL_APP_CLIENT_SECRET ?? "",
    });
    await fetch("https://api.vercel.com/login/oauth/token/revoke", { method: "POST", body }).catch(() => {});
  }
  await clearAuth();
  await clearPending();
  return json({ provider: null });
}
