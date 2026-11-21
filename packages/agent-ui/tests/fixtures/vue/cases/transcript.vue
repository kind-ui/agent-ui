<script lang="ts">
export const variants = ["all", "plain", "refused", "many-100", "many-5000"] as const;
</script>

<script setup lang="ts">
import type { TranscriptSegment } from "@kind-ui/agent-ui";
import type { TranscriptOptions } from "@kind-ui/agent-ui/core";
import { onMounted, shallowRef } from "vue";
import { Transcript } from "../../../../src/vue/transcript.js";
import { expose } from "../../shared/expose.js";
import { manySegments, standup } from "../../shared/transcript.js";

type Row = TranscriptOptions & { id: string; seekable?: boolean };

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const many = (count: number): Row[] => [
  { id: "many", segments: manySegments(count), seekable: true, motion: "none", query: "" },
];

const first: Record<string, () => Row[]> = {
  all: () => [{ id: "standup", segments: standup, seekable: true }],
  plain: () => [{ id: "plain", label: "Standup notes", segments: standup }],
  refused: () => [{ id: "standup", segments: standup, query: "" }],
  "many-100": () => many(100),
  "many-5000": () => many(5000),
};

const rows = shallowRef<Row[]>(first[props.variant]?.() ?? []);
const recorded: { seeks: [number, string][]; queries: [string, string][] } = { seeks: [], queries: [] };

const options = ({ id: _id, seekable: _seekable, ...row }: Row) => row;
const onQueryChange = (query: string, details: { reason: string }) => recorded.queries.push([query, details.reason]);
const seek = {
  seek: (time: number, details: { reason: string; source: string }) =>
    recorded.seeks.push([time, `${details.reason}:${details.source}`]),
};

const update = (id: string, next: (row: Row) => Row) => {
  rows.value = rows.value.map((row) => (row.id === id ? next(row) : row));
};

onMounted(() =>
  expose({
    kindHost: recorded,
    kindTranscript: {
      set: (id: string, next: Partial<Row>) => update(id, (row) => ({ ...row, ...next })),
      append: (id: string, segment: TranscriptSegment) =>
        update(id, (row) => ({ ...row, segments: [...(row.segments ?? []), segment] })),
    },
  }),
);
</script>

<template>
  <p v-if="!first[props.variant]" data-no-case>No case</p>
  <div v-else class="flex w-[34rem] flex-col gap-3 p-6">
    <Transcript
      v-for="row in rows"
      :id="row.id"
      :key="row.id"
      v-bind="options(row)"
      v-on="row.seekable ? seek : {}"
      @query-change="onQueryChange"
    />
  </div>
</template>
