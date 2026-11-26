<script lang="ts">
  import {
    Composer,
    ComposerInput,
    ComposerSteerMenu,
    ComposerStop,
    ComposerSubmit,
  } from "@/components/ui/svelte/composer/index.js";
  import { Queue } from "@/components/ui/svelte/queue/index.js";

  type Queued = { id: string; status: "pending"; title: string };

  let running = $state(false);
  let queued: Queued[] = $state.raw([]);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const run = () => {
    running = true;
    clearTimeout(timer);
    timer = setTimeout(() => (running = false), 8000);
  };
  const drop = (id: string) => (queued = queued.filter((item) => item.id !== id));
</script>

<div class="flex w-full flex-col gap-3">
  {#if queued.length > 0}
    <!-- Sending now steers the running turn with the follow-up. -->
    <Queue label="Queued follow-ups" items={queued} onRemove={drop} onSend={drop} />
  {/if}
  <Composer
    aria-label="Message"
    {running}
    onSubmit={run}
    onStop={() => (running = false)}
    onSteer={(draft, { mode }) => {
      if (mode === "queue") queued = [...queued, { id: crypto.randomUUID(), status: "pending", title: draft.text }];
    }}
  >
    <ComposerInput aria-label="Prompt" placeholder="Send, then steer while it runs" />
    <ComposerSubmit />
    <ComposerSteerMenu />
    <ComposerStop />
  </Composer>
</div>
