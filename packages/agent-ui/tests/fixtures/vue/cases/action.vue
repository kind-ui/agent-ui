<script lang="ts">
export const variants = ["all", "owned"] as const;
</script>

<script setup lang="ts">
import type { ActionOptions } from "@kind-ui/agent-ui/core";
import { onMounted, shallowRef } from "vue";
import { Action } from "../../../../src/vue/action.js";
import { expose } from "../../shared/expose.js";

type Row = Pick<ActionOptions, "status" | "result" | "open">;

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const owned = props.variant === "owned";
const host = { openings: [] as unknown[][] };
const row = shallowRef<Row>({ status: "running", result: "", ...(owned && { open: true }) });
const opened = (open: boolean, details: { reason: string }) => {
  if (owned) host.openings.push([open, details.reason]);
};

onMounted(() =>
  expose({
    kindHost: host,
    kindAction: {
      set: (next: Partial<Row>) => {
        row.value = { ...row.value, ...next };
      },
      append: (chunk: string) => {
        row.value = { ...row.value, result: `${row.value.result}${chunk}` };
      },
    },
  }),
);
</script>

<template>
  <p v-if="variant !== 'all' && variant !== 'owned'" data-no-case>No case</p>
  <div v-else class="flex w-96 flex-col gap-4 p-6">
    <Action
      id="action"
      label="Explain"
      :quote="'Rate limits reset every hour.\n\n'"
      :status="row.status"
      :result="row.result"
      :open="row.open"
      @open-change="opened"
    />
  </div>
</template>
