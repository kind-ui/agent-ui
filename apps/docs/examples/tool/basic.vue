<script setup lang="ts">
import { fromUIMessagePart } from "@kind-ui/agent-ui/adapters/ai-sdk";
import { computed, ref } from "vue";
import { Tool } from "@/components/ui/vue/tool";

const parts = [
  {
    type: "tool-search_docs",
    toolCallId: "call_1",
    state: "output-available",
    input: { query: "retry with backoff" },
    output: { hits: 3, top: "guides/retries.md" },
  },
  {
    type: "tool-run_tests",
    toolCallId: "call_2",
    state: "input-available",
    input: { filter: "client" },
  },
  {
    type: "tool-delete_branch",
    toolCallId: "call_3",
    state: "approval-requested",
    input: { branch: "old-retry" },
    approval: { id: "approval_1" },
  },
  {
    type: "tool-fetch_url",
    toolCallId: "call_4",
    state: "output-error",
    input: { url: "https://example.com/status" },
    errorText: "Request timed out after 30 s.",
  },
] as const;

// How long each finished call took, which the host knows from its own timing.
const durations: Record<string, number> = { call_1: 1.2, call_4: 30 };

const approved = ref<boolean>();

const steps = computed(() =>
  parts.flatMap((part, index) => {
    const answered =
      part.state === "approval-requested" && approved.value !== undefined
        ? {
            ...part,
            state: "approval-responded" as const,
            approval: { id: part.approval.id, approved: approved.value },
          }
        : part;
    const mapped = fromUIMessagePart(answered, { messageId: "message_1", index });
    if (mapped?.type !== "step" || mapped.step.kind !== "tool") return [];
    return [{ step: mapped.step, durationSeconds: durations[part.toolCallId] }];
  }),
);
</script>

<template>
  <div class="flex flex-col gap-1">
    <Tool
      v-for="{ step, durationSeconds } in steps"
      :key="step.id"
      :call="step.call"
      :error="step.error"
      :duration-seconds="durationSeconds"
      @approve="approved = true"
      @deny="approved = false"
    />
  </div>
</template>
