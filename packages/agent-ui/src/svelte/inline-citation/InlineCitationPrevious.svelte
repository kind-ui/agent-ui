<!-- Shows the previous source. -->
<script lang="ts">
  import { CarouselPrevious } from "@ui-sdk/svelte/carousel";
  import type { ComponentProps } from "svelte";

  // Previous and Next are hidden from agents, which takes the Carousel out of their snapshot: an agent pages with the
  // citation's own `next` and `previous`.
  let { children = chevron, ...props }: ComponentProps<typeof CarouselPrevious> = $props();
</script>

<CarouselPrevious aria-label="Previous source" data-agent-hidden="" data-kind-icon-button="" {...props} {children} />

{#snippet chevron()}
  <!-- Lucide "chevron-left", see THIRD_PARTY_NOTICES.md. -->
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <path d="m15 18-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
{/snippet}
