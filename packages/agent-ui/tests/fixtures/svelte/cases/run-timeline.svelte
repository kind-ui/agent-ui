<script module lang="ts">
  export const variants = ["all", "feed"];
</script>

<script lang="ts">
  import type { RunEvent } from "@kind-ui/agent-ui";
  import type { RunTimelineLoadReason } from "@kind-ui/agent-ui/core";
  import { RunTimeline } from "../../../../src/svelte/run-timeline/index.js";
  import { expose } from "../../shared/expose.js";
  import { appended, earlier, events as initial } from "../../shared/run-timeline.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const feed = $derived(variant === "feed");
  let events: RunEvent[] = $state.raw(initial);
  let busy = $state(false);
  // svelte-ignore state_referenced_locally
  let hasMore = $state(variant !== "feed");
  const loads: RunTimelineLoadReason[] = [];

  expose({
    kindHost: {
      loads,
      append: () => (events = appended(events)),
      settle: () => {
        events = [earlier, ...events];
        hasMore = false;
        busy = false;
      },
    },
  });
</script>

<section id="run-timeline" class="w-[28rem] p-6">
  <RunTimeline
    {events}
    timeZone="UTC"
    {feed}
    order={feed ? "newest-first" : "oldest-first"}
    {busy}
    {hasMore}
    onLoadMore={(details) => {
      loads.push(details.reason);
      busy = true;
    }}
  />
</section>
