<script lang="ts">
import type { AgentAction } from "@ui-sdk/vue/agent";

export const variants = ["all", "stream-40", "stream-2000"] as const;

// Revert marks the diff, so an agent's step there needs a person, which a test grants through `kindHost.permit`.
export const allow = (step: AgentAction) =>
  !step.confirm || (window as { kindHost?: { permit?: boolean } }).kindHost?.permit === true;
</script>

<script setup lang="ts">
import type { DiffCopyReason, DiffOptions, Token } from "@kind-ui/agent-ui/core";
import { onMounted, shallowRef } from "vue";
import { Diff } from "../../../../src/vue/diff.js";
import { after, before, longPatch, renamePatch } from "../../shared/diff.js";
import { expose } from "../../shared/expose.js";

type Row = DiffOptions & { id: string; keepClipboard?: boolean; host?: boolean };

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const highlight = async (code: string): Promise<Token[]> =>
  code
    .split(/(const)/)
    .map((content) => (content === "const" ? { content, color: "light-dark(rgb(160, 0, 160), rgb(230, 150, 230))" } : { content }));

const first: Record<string, Row[]> = {
  all: [
    { id: "edit", file: { path: "src/values.ts", language: "ts" }, before, after, highlight, host: true },
    { id: "rename", patch: renamePatch, keepClipboard: true },
  ],
  "stream-40": [{ id: "stream", patch: longPatch(40), streaming: true }],
  "stream-2000": [{ id: "stream", patch: longPatch(2000), streaming: true }],
};

const rows = shallowRef<Row[]>(first[props.variant] ?? []);
const recorded: { copies: [string, string][]; decisions: [string, string][]; permit?: boolean } = {
  copies: [],
  decisions: [],
};
const waiting: Record<string, () => void> = {};

const decide = (name: string) => (details: { source: string }) => {
  recorded.decisions.push([name, details.source]);
  return new Promise<void>((resolve) => {
    waiting[name] = resolve;
  });
};
const onAccept = decide("accept");
const onRevert = decide("revert");

const options = ({ id: _id, keepClipboard: _keep, host, ...row }: Row) =>
  host ? { ...row, onAccept, onRevert } : row;
// One handler per diff, made once, so a streamed hunk doesn't hand the others a new listener.
const onCopy = Object.fromEntries(
  rows.value.map((row) => [
    row.id,
    (text: string, details: { reason: DiffCopyReason; cancel: () => void }) => {
      recorded.copies.push([text, details.reason]);
      if (row.keepClipboard) details.cancel();
    },
  ]),
);

const update = (id: string, next: (row: Row) => Row) => {
  rows.value = rows.value.map((row) => (row.id === id ? next(row) : row));
};

onMounted(() =>
  expose({
    kindHost: recorded,
    kindDiff: {
      set: (id: string, next: Partial<Row>) => update(id, (row) => ({ ...row, ...next })),
      append: (id: string, text: string) => update(id, (row) => ({ ...row, patch: (row.patch ?? "") + text })),
      settle: (name: string) => waiting[name]?.(),
    },
  }),
);
</script>

<template>
  <p v-if="!first[props.variant]" data-no-case>No case</p>
  <div v-else class="flex w-[40rem] max-w-full flex-col gap-3 p-6">
    <Diff v-for="row in rows" :id="row.id" :key="row.id" v-bind="options(row)" @copy="onCopy[row.id]" />
  </div>
</template>
