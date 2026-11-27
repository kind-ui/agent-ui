<script lang="ts">
  import type { QueueItem } from "@kind-ui/agent-ui";
  import {
    Composer,
    ComposerInput,
    ComposerSendMenu,
    ComposerStop,
    ComposerSubmit,
  } from "@/components/ui/svelte/composer/index.js";
  import { Queue } from "@/components/ui/svelte/queue/index.js";

  let next = 1;
  let running = $state(true);
  let queued: QueueItem[] = $state.raw([
    { id: "0", status: "pending", title: "Then add a test for the expired session case" },
  ]);
  const drop = (id: string) => (queued = queued.filter((item) => item.id !== id));
</script>

<Composer
  aria-label="Message"
  {running}
  onSubmit={() => (running = true)}
  onStop={() => (running = false)}
  onSteer={(draft, { mode }) => {
    if (mode === "queue") queued = [...queued, { id: String(next++), status: "pending", title: draft.text }];
  }}
>
  <Queue label="Queued messages" items={queued} onSend={drop} onEdit={drop} onRemove={drop} />
  <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
  <ComposerSubmit />
  <ComposerStop />
  <ComposerSendMenu />
</Composer>
