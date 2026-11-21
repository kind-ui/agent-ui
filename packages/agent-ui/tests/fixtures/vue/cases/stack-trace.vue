<script lang="ts">
export const variants = ["all", "owned"] as const;
</script>

<script setup lang="ts">
import type { StackFrame } from "@kind-ui/agent-ui";
import type { StackTraceOptions } from "@kind-ui/agent-ui/core";
import { onMounted, shallowRef } from "vue";
import { StackTrace } from "../../../../src/vue/stack-trace.js";
import { expose } from "../../shared/expose.js";
import { assertionStack, typeErrorFrames, typeErrorStack } from "../../shared/stack-trace.js";

type Row = StackTraceOptions & { id: string; openable?: boolean; keepClipboard?: boolean; accepts?: boolean };

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const recorded: {
  copies: [string, string][];
  opened: [number, string, string][];
  shown: [boolean, string][];
} = { copies: [], opened: [], shown: [] };

const all: Row[] = [
  { id: "stack", stack: typeErrorStack, openable: true },
  { id: "frames", label: "TypeError from frames", frames: typeErrorFrames },
  { id: "assertion", stack: assertionStack, defaultOpen: false },
];

const owned: Row[] = [
  { id: "held", stack: typeErrorStack, showLibraryFrames: false, keepClipboard: true },
  { id: "accepted", stack: typeErrorStack, showLibraryFrames: false, accepts: true },
];

const rows = shallowRef(props.variant === "owned" ? owned : props.variant === "all" ? all : []);
const set = (id: string, next: Partial<Row>) => {
  rows.value = rows.value.map((row) => (row.id === id ? { ...row, ...next } : row));
};

type CopyDetails = { reason: string; cancel(): void };
type ShowDetails = { reason: string };

const copied = (row: Row) => (text: string, details: CopyDetails) => {
  recorded.copies.push([text, details.reason]);
  if (row.keepClipboard) details.cancel();
};
const shown = (row: Row) => (show: boolean, details: ShowDetails) => {
  if (!row.accepts) return;
  recorded.shown.push([show, details.reason]);
  set(row.id, { showLibraryFrames: show });
};
const openFrame = (row: Row) =>
  row.openable
    ? (frame: StackFrame, details: { index: number; reason: string; source: string }) => {
        recorded.opened.push([details.index, frame.fn ?? "", `${details.reason}:${details.source}`]);
      }
    : undefined;

onMounted(() => expose({ kindHost: recorded, kindStackTrace: { set } }));
</script>

<template>
  <p v-if="!rows.length" data-no-case>No case</p>
  <div v-else class="flex w-[36rem] flex-col gap-3 p-6">
    <StackTrace
      v-for="row in rows"
      :id="row.id"
      :key="row.id"
      :stack="row.stack"
      :frames="row.frames"
      :label="row.label"
      :default-open="row.defaultOpen"
      :show-library-frames="row.showLibraryFrames"
      :on-open-frame="openFrame(row)"
      @copy="(text: string, details: CopyDetails) => copied(row)(text, details)"
      @show-library-frames-change="(show: boolean, details: ShowDetails) => shown(row)(show, details)"
    />
  </div>
</template>
