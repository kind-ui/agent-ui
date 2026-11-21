<script lang="ts">
export const variants = ["all", "reduced", "none", "refusing", "written", "many-10", "many-200"] as const;
</script>

<script setup lang="ts">
import type { ChangeDetails } from "@ui-sdk/core";
import { onMounted, shallowRef } from "vue";
import { ContextBar } from "../../../../src/vue/context-bar.js";
import { contextChips, contextHost } from "../../shared/context-bar.js";
import { expose } from "../../shared/expose.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const { host, record } = contextHost();
const count = props.variant === "many-10" ? 10 : props.variant === "many-200" ? 200 : 6;
const motion = props.variant === "reduced" ? "reduced" : props.variant === "none" ? "none" : undefined;
const refusing = props.variant === "refusing";
const chips = shallowRef(contextChips(count));

function onRemove(id: string, details: ChangeDetails<string>) {
  record(id, details);
  if (refusing) details.cancel();
  else chips.value = chips.value.filter((chip) => chip.id !== id);
}

onMounted(() => {
  let added = count;
  expose({
    kindHost: host,
    kindContext: {
      add: () => {
        added++;
        chips.value = [...chips.value, { id: `added-${added}`, label: `notes/added-${added}.md and more`, kind: "file" }];
      },
    },
  });
});
</script>

<template>
  <div class="p-6" :style="{ width: '360px', boxSizing: 'content-box' }">
    <ContextBar
      id="context"
      :chips="chips"
      :motion="motion"
      :style="{ '--kind-context-chip-max-width': '120px' }"
      @remove="onRemove"
    />
    <textarea id="below" aria-label="Message" />
  </div>
</template>
