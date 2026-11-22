<script lang="ts">
export const variants = ["all", "refused"] as const;
</script>

<script setup lang="ts">
import type { TestResultsOptions } from "@kind-ui/agent-ui/core";
import { onMounted, shallowRef } from "vue";
import { TestResults } from "../../../../src/vue/test-results.js";
import { expose } from "../../shared/expose.js";
import { suites } from "../../shared/test-results.js";

type Row = TestResultsOptions & { id: string };

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const recorded: { filters: [string, string][]; expanded: [string[], string][] } = {
  filters: [],
  expanded: [],
};

const all: Row[] = [
  { id: "results", suites, defaultOpen: true },
  { id: "live", label: "Live run", suites: [], status: "running" },
];

const refused: Row[] = [
  { id: "results", suites, defaultOpen: true, filter: "all", expanded: ["auth", "auth/bad"] },
];

const rows = shallowRef(props.variant === "refused" ? refused : all);

type Change<Key extends "onFilterChange" | "onExpandedChange"> = Parameters<NonNullable<TestResultsOptions[Key]>>;

function filterChange(...[filter, details]: Change<"onFilterChange">) {
  recorded.filters.push([filter, `${details.reason}:${details.source}`]);
}

function expandedChange(...[expanded, details]: Change<"onExpandedChange">) {
  recorded.expanded.push([expanded, details.reason]);
}

onMounted(() =>
  expose({
    kindHost: recorded,
    kindTestResults: {
      set: (id: string, next: Partial<Row>) => {
        rows.value = rows.value.map((row) => (row.id === id ? { ...row, ...next } : row));
      },
    },
  }),
);
</script>

<template>
  <div class="flex w-[36rem] flex-col gap-3 p-6">
    <TestResults
      v-for="row in rows"
      :key="row.id"
      v-bind="row"
      @filter-change="filterChange"
      @expanded-change="expandedChange"
    />
  </div>
</template>
