<!--
  A marker in running text for the sources a sentence came from, with a card that opens on hover, keyboard focus and
  press. More than one source pages in the card. Any `children` replace the marker and the card.
-->
<script lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import InlineCitationCarousel from "./InlineCitationCarousel.svelte";
  import InlineCitationContent from "./InlineCitationContent.svelte";
  import InlineCitationItem from "./InlineCitationItem.svelte";
  import InlineCitationTrigger from "./InlineCitationTrigger.svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Root> & { children?: Snippet };

  let { children: content, open = $bindable(), ...props }: Props = $props();
</script>

<parts.Root {...props} bind:open>
  {#snippet children({ ids })}
    {#if content}
      {@render content()}
    {:else}
      <!-- A citation sits in running text, so no whitespace between its parts. -->
      <InlineCitationTrigger /><InlineCitationContent>
        {#if ids.length > 1}
          <InlineCitationCarousel />
        {:else if ids[0]}
          <InlineCitationItem value={ids[0]} />
        {/if}
      </InlineCitationContent>
    {/if}
  {/snippet}
</parts.Root>
