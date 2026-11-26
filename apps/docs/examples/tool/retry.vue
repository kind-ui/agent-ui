<script setup lang="ts">
import type { ToolCall } from "@kind-ui/agent-ui";
import { computed, ref, watchEffect } from "vue";
import { Tool } from "@/components/ui/vue/tool";

const base: ToolCall = {
  toolCallId: "call_1",
  name: "fetch_url",
  dynamic: false,
  input: { state: "ready", value: { url: "https://example.com/status" } },
};

type Phase = "failed" | "retrying" | "done";

const phase = ref<Phase>("failed");
const retryAt = ref<string>();

// The host waits out its backoff, then the call succeeds.
watchEffect((onCleanup) => {
  if (phase.value !== "retrying") return;
  const timer = setTimeout(() => {
    phase.value = "done";
  }, 5000);
  onCleanup(() => clearTimeout(timer));
});

const call = computed<ToolCall>(() =>
  phase.value === "failed"
    ? { ...base, outcome: "error" }
    : phase.value === "retrying"
      ? { ...base, retry: { attempt: 2, maxAttempts: 3, retryAt: retryAt.value, reason: "Server error 503" } }
      : { ...base, output: { state: "available", value: { status: "ok" } } },
);

const retry = () => {
  retryAt.value = new Date(Date.now() + 5000).toISOString();
  phase.value = "retrying";
};
</script>

<template>
  <div class="flex flex-col gap-1">
    <Tool :call="call" :error="{ message: 'Request timed out after 30 s.' }" default-open :on-retry="retry" />
    <button
      v-if="phase === 'done'"
      type="button"
      data-kind-button="secondary"
      class="self-start"
      @click="phase = 'failed'"
    >
      Start over
    </button>
  </div>
</template>
