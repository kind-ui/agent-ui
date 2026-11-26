<!-- A `RunTimelineEvent` for each row. -->
<script lang="ts">
  import type { RunTimelineEntry } from "@kind-ui/agent-ui/core";
  import RunTimelineEvent from "./RunTimelineEvent.svelte";

  let { rows, entries }: { rows: string[]; entries: Record<string, RunTimelineEntry> } = $props();
</script>

{#each rows as id (id)}<RunTimelineEvent value={id} entry={entries[id] as RunTimelineEntry} />{/each}
