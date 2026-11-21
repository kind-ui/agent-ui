<script lang="ts">
export const variants = ["all", "overflow", "reduced", "static", "form", "custom", "wrap"] as const;
</script>

<script setup lang="ts">
import type { SuggestionItem as Item } from "@kind-ui/agent-ui";
import type { MotionMode } from "@kind-ui/agent-ui/core";
import { computed, onMounted, shallowRef } from "vue";
import {
  Suggestion,
  SuggestionControls,
  SuggestionItem,
  SuggestionNext,
  SuggestionPrevious,
  SuggestionViewport,
} from "../../../../src/vue/suggestion.js";
import { expose } from "../../shared/expose.js";
import { added, manySuggestions, suggestionHost, suggestions } from "../../shared/suggestion.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const { host, record } = suggestionHost();

const many = props.variant === "overflow" || props.variant === "wrap";
const items = shallowRef<Item[]>(many ? manySuggestions : suggestions);
const width = many ? 360 : undefined;
const motion: MotionMode | undefined = props.variant === "reduced" ? "reduced" : undefined;
const pickable = props.variant !== "static";
const inForm = props.variant === "form";
const custom = props.variant === "custom";
const wrap = props.variant === "wrap";

const suggestionProps = computed(() => ({
  id: "suggestion",
  suggestions: items.value,
  ...(pickable && { onPick: record }),
  motion,
  ...(wrap && { layout: "wrap" as const }),
}));

function submit() {
  host.submits.push("submit");
}

onMounted(() =>
  expose({
    kindHost: {
      ...host,
      add: () => {
        items.value = [...items.value, added];
      },
      remove: () => {
        items.value = items.value.filter((item) => item.id !== "b");
      },
      rename: () => {
        items.value = items.value.map((item) => (item.id === "a" ? { ...item, label: "Summarize it" } : item));
      },
    },
  }),
);
</script>

<template>
  <div class="flex flex-col gap-4 p-6" :style="width ? { width: `${width}px` } : undefined">
    <p id="above">Above</p>
    <form v-if="inForm" @submit.prevent="submit">
      <Suggestion v-bind="suggestionProps" />
    </form>
    <Suggestion v-else-if="custom" v-bind="suggestionProps">
      <SuggestionViewport>
        <SuggestionItem v-for="item in items" :key="item.id" :value="item.id" />
      </SuggestionViewport>
      <SuggestionControls>
        <SuggestionPrevious />
        <SuggestionNext />
      </SuggestionControls>
    </Suggestion>
    <Suggestion v-else v-bind="suggestionProps" />
    <p id="below">Below</p>
  </div>
</template>
