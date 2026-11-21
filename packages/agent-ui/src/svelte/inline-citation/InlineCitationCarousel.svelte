<!--
  UI SDK's Carousel, a slide per source with Previous, the page and Next below. Rendered only for more than one
  source. Any `children` replace the slides and controls, inside the Carousel.
-->
<script lang="ts">
  import { Carousel, CarouselContent, CarouselItem, CarouselViewport } from "@ui-sdk/svelte/carousel";
  import type { ComponentProps, Snippet } from "svelte";
  import InlineCitationIndex from "./InlineCitationIndex.svelte";
  import InlineCitationItem from "./InlineCitationItem.svelte";
  import InlineCitationNext from "./InlineCitationNext.svelte";
  import InlineCitationPrevious from "./InlineCitationPrevious.svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Carousel> & { children?: Snippet };

  let { children: content, ...props }: Props = $props();
</script>

<!-- Every Carousel part is a `span`, so the card stays valid inside a paragraph. -->
{#snippet span({ props, state, children }: { props: object; state: unknown; children?: Snippet<[never]> })}
  <span {...props}>{@render children?.(state as never)}</span>
{/snippet}

<parts.Carousel {...props}>
  {#snippet children({ controller, defaultPage, ids })}
    <Carousel render={span} {controller} {defaultPage} drag={false} aria-label="Sources">
      {#if content}
        {@render content()}
      {:else}
        <CarouselViewport render={span}>
          <CarouselContent render={span}>
            {#each ids as id (id)}
              <CarouselItem render={span}>
                <InlineCitationItem value={id} />
              </CarouselItem>
            {/each}
          </CarouselContent>
        </CarouselViewport>
        <span data-inline-citation-controls="">
          <InlineCitationPrevious />
          <InlineCitationIndex />
          <InlineCitationNext />
        </span>
      {/if}
    </Carousel>
  {/snippet}
</parts.Carousel>
