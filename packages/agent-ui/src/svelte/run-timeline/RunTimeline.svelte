<!--
  A run's events in time order, on UI SDK's Timeline: a list with one Tab stop that Up and Down move through, or a
  feed of articles with `feed`. Show earlier sits before the oldest event while `hasMore`. Any `children` replace the
  events inside the Timeline; `RunTimelineEvents` draws them.
-->
<script lang="ts">
  import type { RunTimelineRootState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import { KindTimeline } from "../internal/timeline/index.js";
  import { parts } from "./parts.js";
  import RunTimelineEnd from "./RunTimelineEnd.svelte";
  import RunTimelineEvents from "./RunTimelineEvents.svelte";

  type Props = { [K in keyof ComponentProps<typeof parts.Root> as K extends "children" ? never : K]: ComponentProps<
    typeof parts.Root
  >[K] } & { children?: Snippet };

  let { children: events, ...props }: Props = $props();
</script>

<parts.Root {...props}
  >{#snippet children(state: RunTimelineRootState)}{#if state.order === "oldest-first"}<RunTimelineEnd
      />{/if}<KindTimeline aria-label={state.label} feed={state.feed} busy={state.busy}
      >{#if events}{@render events()}{:else}<RunTimelineEvents rows={state.rows} entries={state.entries}
        />{/if}</KindTimeline
    >{#if state.order === "newest-first"}<RunTimelineEnd />{/if}{/snippet}</parts.Root
>
