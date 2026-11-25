"use client";

import { useEffect, useRef, useState } from "react";
import { Notice } from "@/components/ui/notice";
import type { Connection } from "@/lib/runtime";

type Device = { provider: "chatgpt" | "grok"; userCode: string; verificationUrl: string; intervalMs: number };

const PROVIDER_NAMES = { chatgpt: "ChatGPT", grok: "Grok", vercel: "Vercel" } as const;
const SIGN_IN_ERRORS: Record<string, string> = {
  "vercel-unconfigured": "Sign in with Vercel isn't set up on this site yet.",
  "vercel-denied": "Vercel sign-in was cancelled.",
  "vercel-state": "Vercel sign-in expired. Try again.",
  "vercel-token": "Vercel didn't accept the sign-in. Try again.",
  "vercel-team": "Couldn't find a Vercel team to make an AI Gateway key on.",
  "vercel-key-403":
    "Vercel didn't let this site make an AI Gateway key. Grant the AI Gateway API Keys permission and try again.",
};

const post = (url: string, method = "POST") => fetch(url, { method, headers: { "x-fx-gui": "1" } });

export function SignIn({
  vercelAvailable,
  jspi,
  onConnect,
}: {
  vercelAvailable: boolean;
  jspi: boolean | null;
  onConnect: (connection: Connection) => void;
}) {
  const [device, setDevice] = useState<Device | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState("");
  const polling = useRef(0);

  useEffect(() => {
    const reason = new URLSearchParams(location.search).get("signin_error");
    if (reason) {
      setError(SIGN_IN_ERRORS[reason] ?? "Sign-in failed. Try again.");
      history.replaceState(null, "", location.pathname);
    }
  }, []);

  // Poll the device sign-in at the provider's interval until it's approved, denied or expired.
  useEffect(() => {
    if (!device) return;
    const run = ++polling.current;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      if (run !== polling.current) return;
      const response = await post(`/api/auth/device/${device.provider}`, "PUT").catch(() => null);
      if (run !== polling.current) return;
      const body = (await response?.json().catch(() => null)) as { status?: string; error?: string } | null;
      if (body?.status === "signed-in") {
        setDevice(null);
        onConnect({ kind: "account", provider: device.provider });
      } else if (body?.status === "waiting" || response?.status === 429) {
        timer = setTimeout(tick, Math.max(device.intervalMs, 3000));
      } else {
        setDevice(null);
        setError(body?.error ?? "Sign-in failed. Try again.");
      }
    };
    timer = setTimeout(tick, Math.max(device.intervalMs, 3000));
    return () => {
      polling.current++;
      clearTimeout(timer);
    };
  }, [device, onConnect]);

  async function startDevice(provider: "chatgpt" | "grok") {
    setError(null);
    setBusy(true);
    try {
      const response = await post(`/api/auth/device/${provider}`);
      const body = (await response.json()) as Omit<Device, "provider"> & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Sign-in failed. Try again.");
      setDevice({ provider, ...body });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure));
    } finally {
      setBusy(false);
    }
  }

  const unsupported = jspi === false;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-6 py-12">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-semibold text-[length:var(--kind-text-2xl)]">fx-gui</h1>
        <p className="text-[length:var(--kind-text-sm)] text-[var(--kind-color-muted)]">
          The fx coding agent, running in this tab. Connect a model to start.
        </p>
      </div>

      {unsupported ? (
        <Notice variant="error" label="This browser can't run fx">
          fx runs here through WebAssembly with JavaScript Promise Integration (JSPI). Use a current Chrome,
          Edge, Firefox or Safari.
        </Notice>
      ) : null}
      {error ? (
        <Notice variant="error" label="Couldn't sign in" onDismiss={() => setError(null)}>
          {error}
        </Notice>
      ) : null}

      {device ? (
        <section
          aria-label={`Sign in with ${PROVIDER_NAMES[device.provider]}`}
          className="flex flex-col gap-3"
        >
          <p className="text-[length:var(--kind-text-sm)]">
            Open{" "}
            <a className="underline" href={device.verificationUrl} target="_blank" rel="noreferrer">
              {new URL(device.verificationUrl).host}
            </a>{" "}
            and enter this code:
          </p>
          <output
            aria-label="Sign-in code"
            className="rounded-[var(--kind-radius)] bg-[var(--kind-color-bubble)] py-3 text-center font-mono text-[length:var(--kind-text-2xl)] tracking-widest"
          >
            {device.userCode}
          </output>
          <p role="status" className="text-[length:var(--kind-text-sm)] text-[var(--kind-color-muted)]">
            Waiting for you to approve it on {PROVIDER_NAMES[device.provider]}…
          </p>
          <button
            type="button"
            data-kind-button=""
            onClick={() => {
              setDevice(null);
              void post("/api/auth/signout");
            }}
          >
            Cancel
          </button>
        </section>
      ) : (
        <div className="flex flex-col gap-2">
          {vercelAvailable ? (
            <a
              data-kind-button="primary"
              data-kind-size="lg"
              href="/api/auth/vercel/authorize"
              aria-disabled={unsupported}
            >
              Continue with Vercel
            </a>
          ) : null}
          <button
            type="button"
            data-kind-button={vercelAvailable ? "secondary" : "primary"}
            data-kind-size="lg"
            disabled={busy || unsupported}
            onClick={() => startDevice("chatgpt")}
          >
            Sign in with ChatGPT
          </button>
          <button
            type="button"
            data-kind-button="secondary"
            data-kind-size="lg"
            disabled={busy || unsupported}
            onClick={() => startDevice("grok")}
          >
            Sign in with Grok
          </button>
          <form
            className="mt-3 flex flex-col gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (key.trim()) onConnect({ kind: "key", apiKey: key.trim() });
            }}
          >
            <label
              className="text-[length:var(--kind-text-sm)] text-[var(--kind-color-muted)]"
              htmlFor="gateway-key"
            >
              Or use your own AI Gateway API key
            </label>
            <div className="flex gap-2">
              <input
                id="gateway-key"
                type="password"
                autoComplete="off"
                spellCheck={false}
                value={key}
                onChange={(event) => setKey(event.target.value)}
                disabled={unsupported}
                className="h-9 min-w-0 flex-1 rounded-[calc(var(--kind-radius)/1.5)] border border-[var(--kind-color-border)] bg-[var(--kind-color-surface)] px-2.5 outline-hidden"
              />
              <button type="submit" data-kind-button="secondary" disabled={!key.trim() || unsupported}>
                Use key
              </button>
            </div>
            <p className="text-[length:var(--kind-text-xs)] text-[var(--kind-color-muted)]">
              Saved in this browser only. Disconnect removes it.
            </p>
          </form>
        </div>
      )}

      <p className="text-[length:var(--kind-text-xs)] text-[var(--kind-color-muted)]">
        Turns run on your own plan and bill you: Vercel's terms and your AI Gateway balance, your ChatGPT plan
        and OpenAI's terms, or your Grok plan and xAI's terms. Sign-in tokens stay in an encrypted cookie on
        this site and never reach this page's scripts. A pasted key is saved in this browser and passes
        through this site only on its way to AI Gateway; the server never stores it. Your thread and workspace
        are saved in this browser until you start a new session.
      </p>
    </main>
  );
}

export const providerName = (connection: Connection) =>
  connection.kind === "key"
    ? "AI Gateway key"
    : connection.kind === "mock"
      ? "Mock model"
      : PROVIDER_NAMES[connection.provider];
