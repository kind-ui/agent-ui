<script lang="ts">
  import { Queue } from "@/components/ui/svelte/queue/index.js";

  let items = $state.raw([
    { id: "limits", status: "pending" as const, title: "Add tests for the limits" },
    {
      id: "docs",
      status: "pending" as const,
      title: "Document the rate limit headers",
      description: "README and the API reference",
    },
    { id: "changelog", status: "pending" as const, title: "Write the changelog entry" },
    { id: "middleware", status: "complete" as const, title: "Write the rate limit middleware" },
    { id: "read", status: "complete" as const, title: "Read the request handlers" },
  ]);
</script>

<Queue
  label="Agent queue"
  {items}
  onReorder={(id, { index }) => {
    const moved = items.find((item) => item.id === id);
    if (!moved) return;
    const rest = items.filter((item) => item !== moved);
    items = [...rest.slice(0, index), moved, ...rest.slice(index)];
  }}
  onRemove={(id) => (items = items.filter((item) => item.id !== id))}
/>
