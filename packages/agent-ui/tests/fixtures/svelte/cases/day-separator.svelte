<script module lang="ts">
  export const variants = ["all", "hydrate"];
</script>

<script lang="ts">
  import { DaySeparator } from "../../../../src/svelte/day-separator/index.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();
</script>

{#if variant === "hydrate"}
  <div><div id="hydrated"><DaySeparator date="2026-11-18T09:30:00Z" timeZone="UTC" /></div></div>
{:else}
<div class="flex flex-col gap-3 p-6">
  <DaySeparator id="today" date="2026-11-18T09:30:00Z" timeZone="UTC"
  /><DaySeparator id="yesterday" date="2026-11-17T09:30:00Z" timeZone="UTC"
  /><DaySeparator id="weekday" date="2026-11-13T09:30:00Z" timeZone="UTC"
  /><DaySeparator id="older" date="2026-10-02T09:30:00Z" timeZone="UTC"
  /><DaySeparator id="level" date="2026-10-02" timeZone="UTC" level={2}
  /><DaySeparator id="absolute" date="2026-11-18T09:30:00Z" timeZone="UTC" relative={false}
  /><DaySeparator id="late-utc" date="2026-11-17T23:30:00Z" timeZone="UTC"
  /><DaySeparator id="late-tokyo" date="2026-11-17T23:30:00Z" timeZone="Asia/Tokyo"
  /><DaySeparator id="undated" timeZone="UTC" />
</div>
{/if}
