<script lang="ts">
  import type { RunEvent } from "@kind-ui/agent-ui";
  import { RunTimeline } from "@/components/ui/svelte/run-timeline/index.js";

  const ada = { id: "ada", name: "Ada" };

  const events: RunEvent[] = [
    {
      id: "started",
      at: "2026-11-10T14:02:00Z",
      title: "Run started",
      status: "complete",
      actor: ada,
      description: "Fix the login redirect on **main**.",
    },
    {
      id: "approved",
      at: "2026-11-10T14:05:00Z",
      title: "Ada approved npm test",
      status: "complete",
      actor: ada,
    },
    {
      id: "tests",
      at: "2026-11-10T14:09:00Z",
      title: "Ran the tests",
      status: "error",
      description: "2 of 312 tests failed in `auth.test.ts`.",
    },
    { id: "fix", at: "2026-11-10T14:11:00Z", title: "Retrying with a fix" },
    { id: "checks", at: "2026-11-10T14:20:00Z", title: "Running checks", status: "running" },
  ];

  const earlier: RunEvent = {
    id: "queued",
    at: "2026-11-09T22:40:00Z",
    title: "Run queued",
    status: "complete",
  };

  let shown = $state.raw(events);
  let busy = $state(false);

  const loadMore = () => {
    busy = true;
    setTimeout(() => {
      shown = [earlier, ...events];
      busy = false;
    }, 600);
  };
</script>

<RunTimeline events={shown} {busy} hasMore={shown[0] !== earlier} onLoadMore={loadMore} class="w-full max-w-md" />
