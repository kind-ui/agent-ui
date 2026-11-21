<script lang="ts">
  import { Notice } from "@/components/ui/svelte/notice/index.js";

  let rateLimited = $state(true);
</script>

<div class="flex w-full max-w-xl flex-col gap-3">
  <Notice label="Indexing your files">Answers may miss files added in the last minute.</Notice>
  <Notice variant="success" label="Connected to GitHub">The assistant can read your repositories now.</Notice>
  {#if rateLimited}
    <Notice variant="warning" label="Rate limited" onDismiss={() => (rateLimited = false)}>
      Responses are slower for the next few minutes.
    </Notice>
  {:else}
    <button type="button" data-kind-button="secondary" class="self-start" onclick={() => (rateLimited = true)}>
      Show the warning again
    </button>
  {/if}
  <Notice variant="error" label="Couldn't reach the model">
    Check your connection and try again.
    {#snippet actions()}
      <button type="button" data-kind-button="secondary">Retry</button>
    {/snippet}
  </Notice>
</div>
