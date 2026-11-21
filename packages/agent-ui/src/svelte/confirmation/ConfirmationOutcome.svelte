<!-- Where the request stands, like "Approved", with the denial's reason, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Outcome> = $props();
</script>

<parts.Outcome {...props}>
  {#snippet children(state: { label: string; reason: string | undefined })}
    {#if content}
      {@render content(state)}
    {:else}
      <parts.OutcomeIcon />
      <span data-confirmation-label="">{state.label}</span>
      {#if state.reason}<span data-confirmation-reason="">{state.reason}</span>{/if}
    {/if}
  {/snippet}
</parts.Outcome>
