<script lang="ts">
  import { Queue } from "@/components/ui/svelte/queue/index.js";

  let items = $state.raw([
    { id: "logs", status: "pending" as const, title: "Also check the server logs" },
    { id: "pr", status: "pending" as const, title: "Then open a pull request" },
  ]);
  const drop = (id: string) => (items = items.filter((item) => item.id !== id));
</script>

<!-- Your app steers the running turn with the item, then drops it from the queue. -->
<Queue
  label="Queued follow-ups"
  {items}
  onSend={(id) =>
    new Promise<void>((resolve) =>
      setTimeout(() => {
        drop(id);
        resolve();
      }, 600),
    )}
  onRemove={drop}
/>
