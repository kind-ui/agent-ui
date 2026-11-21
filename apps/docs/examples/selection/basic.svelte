<script lang="ts">
  import type { SelectionActionRun } from "@kind-ui/agent-ui/core";
  import { Markdown } from "@/components/ui/svelte/markdown/index.js";
  import { Selection } from "@/components/ui/svelte/selection/index.js";

  const actions = [
    { id: "ask", label: "Ask", description: "Ask about the selected text" },
    { id: "quote", label: "Quote", description: "Quote it in your reply" },
    { id: "copy", label: "Copy" },
  ];

  const reply =
    "Three requests timed out after 30 seconds. Add a retry with exponential backoff to `fetchOrders`, and cap it at three attempts so a slow server can't hold the queue.";

  let chosen: string | undefined = $state();

  const onAction = ({ actionId, text }: SelectionActionRun) => {
    if (actionId === "copy") void navigator.clipboard.writeText(text);
    else chosen = `${actionId === "ask" ? "Asked about" : "Quoted"}: “${text}”`;
  };
</script>

<div class="flex w-full max-w-md flex-col gap-3">
  <Selection {actions} {onAction}>
    <Markdown source={reply} />
  </Selection>
  <p class="text-sm text-[var(--kind-color-muted)]">{chosen ?? "Nothing chosen yet."}</p>
</div>
