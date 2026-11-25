<script lang="ts">
import { confirmationHost } from "../../shared/confirmation.js";
import { retryHost, retryRows } from "../../shared/tool-retry.js";

export const variants = ["all", "retry", "many-10", "many-500"] as const;

const { host, approve, deny } = confirmationHost();
const { retries, retry } = retryHost();
</script>

<script setup lang="ts">
import type { ToolCall } from "@kind-ui/agent-ui";
import type { ToolOptions } from "@kind-ui/agent-ui/core";
import { onMounted, shallowRef } from "vue";
import { Tool } from "../../../../src/vue/tool.js";
import { expose } from "../../shared/expose.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

type Row = Pick<
  ToolOptions,
  "status" | "error" | "motion" | "label" | "onApprove" | "onDeny" | "onRetry" | "retry" | "defaultOpen"
> & {
  call: ToolCall;
};

const call = (name: string, fields: Partial<ToolCall> = {}): ToolCall => ({
  toolCallId: name,
  name,
  dynamic: false,
  input: { state: "ready", value: { query: "steps" } },
  ...fields,
});

const all: Record<string, Row> = {
  search: { call: call("search_docs", { input: { state: "streaming", value: { query: "ste" } } }) },
  read: { call: call("read_file", { input: { state: "ready", value: { path: "README.md" } } }) },
  run: { call: call("run_tests") },
  approve: {
    call: call("delete_file", { approval: { approvalId: "a1", generation: 1, state: "requested" } }),
    onApprove: approve,
    onDeny: deny,
  },
  done: { call: call("summarize", { output: { state: "available", value: "Found **3** results." } }) },
  failed: {
    call: call("fetch_url", { outcome: "error" }),
    error: { message: "Request timed out after 30 s." },
  },
};

const many = (size: number) =>
  Object.fromEntries(Array.from({ length: size }, (_, i) => [`tool-${i}`, { call: call(`tool_${i}`) }]));

const retrying: Record<string, Row> = {
  failed: { ...retryRows.failed, onRetry: retry("failed") },
  other: { ...retryRows.other, onRetry: retry("other") },
  retrying: retryRows.retrying,
};

const rows = shallowRef<Record<string, Row>>(
  props.variant === "all"
    ? all
    : props.variant === "retry"
      ? retrying
      : many(Number(props.variant.slice("many-".length))),
);

const update = (id: string, next: (row: Row) => Row) => {
  rows.value = { ...rows.value, [id]: next(rows.value[id] as Row) };
};

onMounted(() =>
  expose({
    kindHost: host,
    kindRetries: retries,
    kindTool: {
      set: (id: string, next: Partial<Row>) => update(id, (row) => ({ ...row, ...next })),
      setCall: (id: string, next: Partial<ToolCall>) =>
        update(id, (row) => ({ ...row, call: { ...row.call, ...next } })),
    },
  }),
);
</script>

<template>
  <div class="flex w-[28rem] flex-col gap-2 p-6">
    <Tool v-for="(row, id) in rows" :id="id" :key="id" v-bind="row" />
  </div>
</template>
