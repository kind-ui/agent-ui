<!--
  The scroller around the Waterfall, with its header row and the rows in view, each placed at its offset. The axis is
  hidden from agents, which hides UI SDK's Waterfall from them while the rows stay the Trace's.
-->
<script lang="ts">
  import type { TraceViewportState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import {
    KindWaterfall,
    KindWaterfallAxis,
    KindWaterfallColumnHeader,
    KindWaterfallHeaderRow,
  } from "../internal/waterfall/index.js";
  import { parts } from "./parts.js";
  import TraceRow from "./TraceRow.svelte";

  let { children, ...props }: ComponentProps<typeof parts.Viewport> = $props();
</script>

<!-- The state is a keyless proxy, so the Waterfall's props pass by name. -->
{#snippet fallback({ waterfall, rows, height }: TraceViewportState)}<KindWaterfall
    controller={waterfall.controller}
    items={waterfall.items}
    range={waterfall.range}
    locale={waterfall.locale}
    getBarLabel={waterfall.getBarLabel}
    defaultValue={waterfall.defaultValue}
    defaultExpanded={waterfall.defaultExpanded}
    onValueChange={waterfall.onValueChange}
    onExpandedChange={waterfall.onExpandedChange}
    onHighlight={waterfall.onHighlight}
    aria-label={waterfall["aria-label"]}
    aria-rowcount={waterfall["aria-rowcount"]}
    style="height: {height}px"
    ><KindWaterfallHeaderRow aria-rowindex={1}
      ><KindWaterfallColumnHeader>Name</KindWaterfallColumnHeader><KindWaterfallColumnHeader
        >Duration</KindWaterfallColumnHeader
      ><KindWaterfallColumnHeader
        ><span class="sr-only">Timeline</span><parts.Axis
          ><KindWaterfallAxis data-agent-hidden="" maxTicks={5} /></parts.Axis
        ></KindWaterfallColumnHeader
      ></KindWaterfallHeaderRow
    >{#each rows as row (row.key)}<TraceRow {row} />{/each}</KindWaterfall
  >{/snippet}

<parts.Viewport {...props} children={children ?? fallback} />
