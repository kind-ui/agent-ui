import {
  clearPending,
  json,
  limited,
  readPending,
  sameOrigin,
  writeAuth,
  writePending,
} from "@/lib/server/session";

// Device code sign-in for a ChatGPT or Grok plan, with libfx's own sign-in modules.
// POST starts it and returns only the code and link; PUT polls once. The device secret stays in a sealed cookie.

type Device = { provider: string; device: { expiresAt: number; intervalMs: number } };

const signIn = (provider: string) =>
  provider === "chatgpt" ? import("libfx/chatgpt") : provider === "grok" ? import("libfx/grok") : null;

function reason(error: unknown) {
  const code = (error as { code?: string })?.code ?? "";
  if (code.endsWith("DEVICE_CODE_UNAVAILABLE")) return "This account doesn't allow device code sign-in.";
  if (code.endsWith("EXPIRED")) return "The code expired. Start again.";
  if (code.endsWith("DENIED")) return "Sign-in was denied.";
  return "Sign-in failed. Try again.";
}

export async function POST(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const module = signIn(provider);
  if (!module || !sameOrigin(request)) return json({ error: "Not found" }, 404);
  const limit = limited(request, "device-start", 6);
  if (limit) return limit;
  try {
    const device = await (await module).startDeviceSignIn();
    await writePending({ provider, device });
    return json({
      userCode: device.userCode,
      verificationUrl: device.verificationUrl,
      intervalMs: device.intervalMs,
      expiresAt: device.expiresAt,
    });
  } catch (error) {
    return json({ error: reason(error) }, 502);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const module = signIn(provider);
  if (!module || !sameOrigin(request)) return json({ error: "Not found" }, 404);
  const limit = limited(request, "device-poll", 40);
  if (limit) return limit;
  const pending = await readPending<Device>();
  if (!pending || pending.provider !== provider) return json({ error: "No sign-in in progress." }, 400);
  if (Date.now() > pending.device.expiresAt) {
    await clearPending();
    return json({ error: "The code expired. Start again." }, 410);
  }
  try {
    const credentials = await (await module).pollDeviceSignIn(pending.device as never);
    if (!credentials) return json({ status: "waiting" });
    await clearPending();
    await writeAuth({ provider, credentials } as never);
    return json({ status: "signed-in", provider });
  } catch (error) {
    await clearPending();
    return json({ error: reason(error) }, 400);
  }
}
