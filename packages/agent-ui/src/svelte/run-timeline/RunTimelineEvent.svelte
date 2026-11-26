<!--
  One event: a Timeline item holding its marker, title, time, actor and description. The connector is hidden from
  agents, which hides UI SDK's Timeline from them while the events stay the Run Timeline's.
-->
<script lang="ts">
  import type { RunTimelineEntry } from "@kind-ui/agent-ui/core";
  import {
    KindTimelineConnector,
    KindTimelineDescription,
    KindTimelineItem,
    KindTimelineMarker,
    KindTimelineTime,
    KindTimelineTitle,
  } from "../internal/timeline/index.js";
  import { parts } from "./parts.js";
  import RunTimelineActor from "./RunTimelineActor.svelte";
  import RunTimelineDescription from "./RunTimelineDescription.svelte";
  import RunTimelineMarker from "./RunTimelineMarker.svelte";
  import RunTimelineTime from "./RunTimelineTime.svelte";
  import RunTimelineTitle from "./RunTimelineTitle.svelte";

  let { value, entry }: { value: string; entry: RunTimelineEntry } = $props();
</script>

<parts.Item {value}
  ><KindTimelineItem {value} status={entry.current ? "current" : undefined}
    ><KindTimelineMarker><RunTimelineMarker /></KindTimelineMarker><KindTimelineConnector
      data-agent-hidden=""
    /><KindTimelineTitle><RunTimelineTitle /></KindTimelineTitle><KindTimelineTime datetime={entry.at}
      ><RunTimelineTime /></KindTimelineTime
    >{#if entry.actor || entry.description}<KindTimelineDescription
        ><RunTimelineActor /><RunTimelineDescription /></KindTimelineDescription
      >{/if}</KindTimelineItem
  ></parts.Item
>
