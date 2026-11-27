<script lang="ts">
  import { onMount } from "svelte";
  import { Notice } from "@/components/ui/svelte/notice/index.js";

  const HOUR = 3_600_000;

  // Resets are relative to now, which only the browser knows, so the server renders the notices without them.
  let now = $state<number>();
  onMount(() => {
    now = Date.now();
  });
  const at = (hours: number) => (now === undefined ? undefined : new Date(now + hours * HOUR).toISOString());
  let warned = $state(true);
</script>

<div class="flex w-full max-w-xl flex-col gap-3">
  {#if warned}
    <Notice variant="warning" label="12 requests left" resetsAt={at(76)} onDismiss={() => (warned = false)}>
      You've used most of this week's requests.
      {#snippet actions()}
        <button type="button" data-kind-button="secondary">Upgrade</button>
      {/snippet}
    </Notice>
  {:else}
    <button type="button" data-kind-button="secondary" class="self-start" onclick={() => (warned = true)}>
      Show the warning again
    </button>
  {/if}
  <Notice variant="error" label="You've reached your weekly limit" resetsAt={at(0.7)}>
    New runs pause until then.
    {#snippet actions()}
      <button type="button" data-kind-button="secondary">Continue at reset</button>
      <button type="button" data-kind-button="secondary">Switch to Claude Sonnet 5.5</button>
      <button type="button" data-kind-button="primary">Use credits</button>
    {/snippet}
  </Notice>
</div>
