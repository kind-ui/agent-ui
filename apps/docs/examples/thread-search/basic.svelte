<script lang="ts">
  import { ThreadSearch } from "@/components/ui/svelte/thread-search/index.js";

  let threads = $state.raw([
    {
      id: "t1",
      title: "Fix the flaky login test",
      updatedAt: "2026-11-18T09:12:00Z",
      status: "running" as const,
    },
    {
      id: "t2",
      title: "Release notes for 0.6",
      updatedAt: "2026-11-02T16:40:00Z",
      pinned: true,
      snippet: "Draft the highlights and the breaking changes",
    },
    {
      id: "t3",
      title: "Rename the billing tables",
      updatedAt: "2026-11-18T07:30:00Z",
      status: "awaiting-input" as const,
      snippet: "Waiting for approval to run the migration",
    },
    { id: "t4", title: "Onboarding checklist", updatedAt: "2026-11-10T11:05:00Z", group: "Handbook" },
    {
      id: "t5",
      title: "Why is the build slow?",
      updatedAt: "2026-11-17T18:22:00Z",
      snippet: "Type checking takes 40 s",
    },
    { id: "t6", title: "Dark mode tokens", updatedAt: "2026-11-14T13:50:00Z" },
    {
      id: "t7",
      title: "Search index size",
      updatedAt: "2026-11-12T08:15:00Z",
      snippet: "Split the index by section",
    },
    { id: "t8", title: "Plan the docs site", updatedAt: "2026-10-21T10:00:00Z" },
    { id: "t9", title: "Upgrade to Node 24", updatedAt: "2026-09-03T15:30:00Z", pinned: true },
    { id: "t10", title: "Kickoff notes", updatedAt: "2025-12-01T09:00:00Z" },
  ]);
  let opened = $state("Nothing opened yet");
</script>

<div style="display: grid; gap: 0.75rem; justify-items: start">
  <ThreadSearch
    {threads}
    now="2026-11-18"
    timeZone="UTC"
    shortcut="mod+k"
    onSelect={(id: string) => (opened = `Opened: ${threads.find((thread) => thread.id === id)?.title}`)}
    onNew={(query: string) => {
      const title = query.trim() || "New chat";
      threads = [{ id: `new-${threads.length + 1}`, title, updatedAt: "2026-11-18T12:00:00Z" }, ...threads];
      opened = `Opened: ${title}`;
    }}
  />
  <p>{opened}</p>
</div>
