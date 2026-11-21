<script module lang="ts">
  export const variants = ["all", "refused"];
</script>

<script lang="ts">
  import type { TestResultsOptions } from "@kind-ui/agent-ui/core";
  import { TestResults } from "../../../../src/svelte/test-results/index.js";
  import { expose } from "../../shared/expose.js";
  import { suites } from "../../shared/test-results.js";

  type Row = TestResultsOptions & { id: string };

  let { variant }: { variant: string; params: URLSearchParams } = $props();

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

  // svelte-ignore state_referenced_locally
  let rows: Row[] = $state.raw(variant === "refused" ? refused : all);
  const set = (id: string, next: Partial<Row>) => {
    rows = rows.map((row) => (row.id === id ? { ...row, ...next } : row));
  };

  expose({ kindHost: recorded, kindTestResults: { set } });
</script>

<div class="flex w-[36rem] flex-col gap-3 p-6">
  {#each rows as { id, filter, expanded, ...row } (id)}
    {@const onFilterChange = (next: string, details: { reason: string; source: string }) =>
      recorded.filters.push([next, `${details.reason}:${details.source}`])}
    {@const onExpandedChange = (next: string[], details: { reason: string }) =>
      recorded.expanded.push([next, details.reason])}
    {#if filter === undefined && expanded === undefined}
      <TestResults {id} {...row} {onFilterChange} {onExpandedChange} />
    {:else}
      <TestResults
        {id}
        {...row}
        bind:filter={() => filter, () => {}}
        bind:expanded={() => expanded, () => {}}
        {onFilterChange}
        {onExpandedChange}
      />
    {/if}
  {/each}
</div>
