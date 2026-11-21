<script setup lang="ts">
import { shallowRef } from "vue";
import { Suggestion } from "@/components/ui/vue/suggestion";

const suggestions = [
  { id: "summarize", label: "Summarize this thread" },
  { id: "reply", label: "Draft a reply", description: "Short and friendly" },
  { id: "questions", label: "List the open questions" },
  { id: "issues", label: "Find related issues" },
  { id: "tests", label: "Suggest a test plan" },
];

const prompt = shallowRef<string>();

function pick(id: string) {
  prompt.value = suggestions.find((suggestion) => suggestion.id === id)?.label;
}
</script>

<template>
  <div class="flex w-full max-w-md flex-col gap-3">
    <Suggestion :suggestions="suggestions" @pick="pick" />
    <p class="text-sm text-[var(--kind-color-muted)]">
      {{ prompt ? `Sent: ${prompt}` : "Nothing sent yet." }}
    </p>
  </div>
</template>
