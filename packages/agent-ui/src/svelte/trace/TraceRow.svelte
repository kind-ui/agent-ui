<!-- A Waterfall row for a span: its name, duration and bar. -->
<script lang="ts">
  import type { TraceRow } from "@kind-ui/agent-ui/core";
  import {
    KindWaterfallBar,
    KindWaterfallCell,
    KindWaterfallIndicator,
    KindWaterfallRow,
    KindWaterfallRowHeader,
  } from "../internal/waterfall/index.js";
  import TraceBar from "./TraceBar.svelte";
  import TraceDuration from "./TraceDuration.svelte";
  import TraceName from "./TraceName.svelte";

  let { row }: { row: TraceRow } = $props();
</script>

<KindWaterfallRow value={row.props.value} aria-rowindex={row.props["aria-rowindex"]} style="top: {row.top}px"
  ><KindWaterfallRowHeader
    >{#if row.branch}<KindWaterfallIndicator
        ><!-- Lucide "chevron-right", see THIRD_PARTY_NOTICES.md. --><svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"><path d="m9 18 6-6-6-6" stroke-linecap="round" stroke-linejoin="round" /></svg
        ></KindWaterfallIndicator
      >{:else}<span data-trace-spacer=""></span>{/if}<TraceName value={row.key} /></KindWaterfallRowHeader
  ><KindWaterfallCell><TraceDuration value={row.key} /></KindWaterfallCell><KindWaterfallBar
    ><TraceBar value={row.key} /></KindWaterfallBar
  ></KindWaterfallRow
>
