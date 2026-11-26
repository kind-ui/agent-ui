<script module lang="ts">
  export const variants = ["all", "read-only", "monday", "rtl", "narrow", "hydrate"];
</script>

<script lang="ts">
  import { ActivityGraph } from "../../../../src/svelte/activity-graph/index.js";
  import { activityDays, activityHost, activityNow } from "../../shared/activity-graph.js";
  import { expose } from "../../shared/expose.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const { host, record } = activityHost();
  expose({ kindHost: host });
</script>

{#if variant === "hydrate"}
  <div><div id="hydrated"><ActivityGraph days={activityDays.slice(7)} timeZone="UTC" weeks={20} /></div></div>
{:else}
  <div class="bg-[var(--kind-color-surface)] p-6">
    {#if variant === "read-only"}
      <ActivityGraph days={activityDays} now={activityNow} timeZone="UTC" />
    {:else if variant === "monday"}
      <ActivityGraph
        days={activityDays}
        now={activityNow}
        timeZone="UTC"
        weekStart={1}
        weeks={8}
        unit="tokens"
        unitOne="token"
        label="Tokens"
        onSelect={record}
      />
    {:else if variant === "rtl"}
      <div dir="rtl"><ActivityGraph days={activityDays} now={activityNow} timeZone="UTC" onSelect={record} /></div>
    {:else if variant === "narrow"}
      <div style="width: 320px"><ActivityGraph days={activityDays} now={activityNow} timeZone="UTC" /></div>
    {:else}
      <ActivityGraph days={activityDays} now={activityNow} timeZone="UTC" onSelect={record} />
    {/if}
  </div>
{/if}
