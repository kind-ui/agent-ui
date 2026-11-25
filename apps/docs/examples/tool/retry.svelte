<script lang="ts">
  import type { ToolCall } from "@kind-ui/agent-ui";
  import { Tool } from "@/components/ui/svelte/tool/index.js";

  const base: ToolCall = {
    toolCallId: "call_1",
    name: "fetch_url",
    dynamic: false,
    input: { state: "ready", value: { url: "https://example.com/status" } },
  };

  let phase = $state<"failed" | "retrying" | "done">("failed");
  let retryAt = $state<string>();

  // The host waits out its backoff, then the call succeeds.
  $effect(() => {
    if (phase !== "retrying") return;
    const timer = setTimeout(() => (phase = "done"), 5000);
    return () => clearTimeout(timer);
  });

  const call: ToolCall = $derived(
    phase === "failed"
      ? { ...base, outcome: "error" }
      : phase === "retrying"
        ? { ...base, retry: { attempt: 2, maxAttempts: 3, retryAt, reason: "Server error 503" } }
        : { ...base, output: { state: "available", value: { status: "ok" } } },
  );
</script>

<div class="flex flex-col gap-1">
  <Tool
    {call}
    error={{ message: "Request timed out after 30 s." }}
    defaultOpen
    onRetry={() => {
      retryAt = new Date(Date.now() + 5000).toISOString();
      phase = "retrying";
    }}
  />
  {#if phase === "done"}
    <button type="button" data-kind-button="secondary" class="self-start" onclick={() => (phase = "failed")}>
      Start over
    </button>
  {/if}
</div>
