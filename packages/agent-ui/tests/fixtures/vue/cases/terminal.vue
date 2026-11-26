<script lang="ts">
export const variants = ["approval", "all", "owned", "stream-10", "stream-1000"] as const;
</script>

<script setup lang="ts">
import type { TerminalCopyReason, TerminalOptions } from "@kind-ui/agent-ui/core";
import { onMounted, shallowRef } from "vue";
import { Terminal } from "../../../../src/vue/terminal.js";
import { expose } from "../../shared/expose.js";
import { confirmationHost } from "../../shared/confirmation.js";
import { approvalTerminals, installRun, manyLines, testRun } from "../../shared/terminal.js";

type Row = TerminalOptions & { id: string; keepClipboard?: boolean };

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const all: Row[] = [
  { id: "test", command: "npm test", output: testRun, durationSeconds: 4.2 },
  {
    id: "failed",
    command: "npm run lint",
    output: testRun,
    exitCode: 1,
    durationSeconds: 4.2,
    defaultOpen: true,
  },
  { id: "install", command: "npm install", output: installRun, exitCode: 0, durationSeconds: 3 },
];

const owned: Row[] = [
  { id: "held", command: "npm run dev", output: installRun, exitCode: 0, open: true, keepClipboard: true },
  { id: "empty", command: "npm run build", output: "" },
];

const streaming = (count: number): Row[] => [{ id: "stream", command: "npm run build", output: manyLines(count) }];

const first: Record<string, Row[]> = {
  all,
  owned,
  "stream-10": streaming(10),
  "stream-1000": streaming(1000),
};

const rows = shallowRef<Row[]>(first[props.variant] ?? []);
const recorded: { copies: [string, string][] } = { copies: [] };

const options = ({ id: _id, keepClipboard: _keep, ...row }: Row) => row;
// One handler per terminal, made once, so a new output doesn't hand the others a new listener.
const onCopy = Object.fromEntries(
  rows.value.map((row) => [
    row.id,
    (text: string, details: { reason: TerminalCopyReason; cancel: () => void }) => {
      recorded.copies.push([text, details.reason]);
      if (row.keepClipboard) details.cancel();
    },
  ]),
);

const approvals = shallowRef(approvalTerminals());
const { host, approve, deny, always } = confirmationHost();

const update = (id: string, next: (row: Row) => Row) => {
  rows.value = rows.value.map((row) => (row.id === id ? next(row) : row));
};

onMounted(() =>
  expose(
    props.variant === "approval"
      ? {
          kindHost: host,
          kindTerminal: {
            set: (id: string, next: Partial<TerminalOptions>) => {
              approvals.value = approvals.value.map((row) =>
                row.id === id ? { ...row, options: { ...row.options, ...next } } : row,
              );
            },
          },
        }
      : {
          kindHost: recorded,
          kindTerminal: {
            set: (id: string, next: Partial<Row>) => update(id, (row) => ({ ...row, ...next })),
            append: (id: string, text: string) =>
              update(id, (row) => ({ ...row, output: (row.output ?? "") + text })),
          },
        },
  ),
);
</script>

<template>
  <div v-if="props.variant === 'approval'" class="flex w-full max-w-[40rem] flex-col gap-4 p-6">
    <Terminal
      v-for="{ id, options: row } in approvals"
      :id="id"
      :key="id"
      v-bind="row"
      :on-approve="approve"
      :on-deny="deny"
      :on-always-allow="always"
    />
  </div>
  <p v-else-if="!first[props.variant]" data-no-case>No case</p>
  <div v-else class="flex w-[34rem] flex-col gap-3 p-6">
    <Terminal v-for="row in rows" :id="row.id" :key="row.id" v-bind="options(row)" @copy="onCopy[row.id]" />
  </div>
</template>
