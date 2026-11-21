<!--
  A row of prompts a person can send in one press. It scrolls sideways when the prompts don't fit, with Previous and
  Next beside it, or wraps onto more lines with `layout="wrap"`. Any `children` replace the row and its buttons:
  `SuggestionItem`s inside the Carousel, or `SuggestionChip`s when it wraps.
-->
<script lang="ts">
  import type { SuggestionRootState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import { KindCarousel } from "../internal/carousel/index.js";
  import { parts } from "./parts.js";
  import SuggestionChip from "./SuggestionChip.svelte";
  import SuggestionControls from "./SuggestionControls.svelte";
  import SuggestionItem from "./SuggestionItem.svelte";
  import SuggestionViewport from "./SuggestionViewport.svelte";

  type Props = ComponentProps<typeof parts.Root> & { children?: Snippet };

  let { children: content, ...props }: Props = $props();
</script>

<parts.Root {...props}>
  {#snippet children({ label, layout, suggestions })}
    {#if layout === "wrap"}
      {#if content}
        {@render content()}
      {:else}
        {#each suggestions as suggestion (suggestion.id)}
          <SuggestionChip value={suggestion.id} />
        {/each}
      {/if}
    {:else}
      <KindCarousel aria-label={label} slidesPerPage="auto" dragFree>
        {#if content}
          {@render content()}
        {:else}
          <SuggestionViewport>
            {#each suggestions as suggestion (suggestion.id)}
              <SuggestionItem value={suggestion.id} />
            {/each}
          </SuggestionViewport>
          <SuggestionControls />
        {/if}
      </KindCarousel>
    {/if}
  {/snippet}
</parts.Root>
