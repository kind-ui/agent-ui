import type { ToolCall } from "@kind-ui/agent-ui";
import { createEffect, createSignal, Show } from "solid-js";
import { Tool } from "@/components/ui/solid/tool";

const base: ToolCall = {
  toolCallId: "call_1",
  name: "fetch_url",
  dynamic: false,
  input: { state: "ready", value: { url: "https://example.com/status" } },
};

type Phase = "failed" | "retrying" | "done";

export default function ToolRetryExample() {
  const [phase, setPhase] = createSignal<Phase>("failed");
  const [retryAt, setRetryAt] = createSignal<string>();

  // The host waits out its backoff, then the call succeeds.
  createEffect(phase, (value) => {
    if (value !== "retrying") return;
    const timer = setTimeout(() => setPhase("done"), 5000);
    return () => clearTimeout(timer);
  });

  const call = (): ToolCall =>
    phase() === "failed"
      ? { ...base, outcome: "error" }
      : phase() === "retrying"
        ? { ...base, retry: { attempt: 2, maxAttempts: 3, retryAt: retryAt(), reason: "Server error 503" } }
        : { ...base, output: { state: "available", value: { status: "ok" } } };

  return (
    <div class="flex flex-col gap-1">
      <Tool
        call={call()}
        error={{ message: "Request timed out after 30 s." }}
        defaultOpen
        onRetry={() => {
          setRetryAt(new Date(Date.now() + 5000).toISOString());
          setPhase("retrying");
        }}
      />
      <Show when={phase() === "done"}>
        <button
          type="button"
          data-kind-button="secondary"
          class="self-start"
          onClick={() => setPhase("failed")}
        >
          Start over
        </button>
      </Show>
    </div>
  );
}
