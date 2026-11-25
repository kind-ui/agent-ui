import { json, readAuth } from "@/lib/server/session";

/** Who is signed in, and with what. No credential leaves the server. */
export async function GET() {
  const auth = await readAuth();
  return json({
    provider: auth?.provider ?? null,
    vercelAvailable: Boolean(process.env.VERCEL_APP_CLIENT_ID && process.env.VERCEL_APP_CLIENT_SECRET),
  });
}
