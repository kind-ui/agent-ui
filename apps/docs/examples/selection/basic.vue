<script setup lang="ts">
import type { SelectionActionRun } from "@kind-ui/agent-ui/core";
import { shallowRef } from "vue";
import { Markdown } from "@/components/ui/vue/markdown";
import { Selection } from "@/components/ui/vue/selection";

const actions = [
  { id: "ask", label: "Ask", description: "Ask about the selected text" },
  { id: "quote", label: "Quote", description: "Quote it in your reply" },
  { id: "copy", label: "Copy" },
];

const reply =
  "Three requests timed out after 30 seconds. Add a retry with exponential backoff to `fetchOrders`, and cap it at three attempts so a slow server can't hold the queue.";

const chosen = shallowRef<string>();

function run({ actionId, text }: SelectionActionRun) {
  if (actionId === "copy") void navigator.clipboard.writeText(text);
  else chosen.value = `${actionId === "ask" ? "Asked about" : "Quoted"}: “${text}”`;
}
</script>

<template>
  <div class="flex w-full max-w-md flex-col gap-3">
    <Selection :actions="actions" @action="run">
      <Markdown :source="reply" />
    </Selection>
    <p class="text-sm text-[var(--kind-color-muted)]">{{ chosen ?? "Nothing chosen yet." }}</p>
  </div>
</template>
