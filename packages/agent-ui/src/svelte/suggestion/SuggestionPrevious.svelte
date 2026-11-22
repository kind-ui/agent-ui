<!-- Scrolls back to earlier suggestions. Put it in `SuggestionControls` to hide it while every suggestion fits. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { KindCarouselPrevious } from "../internal/carousel/index.js";

  type Props = ComponentProps<typeof KindCarouselPrevious>;

  // Previous and Next are hidden from agents, which takes the Carousel out of their snapshot: an agent picks any
  // suggestion by its id with the Suggestion's own `pick`, wherever it has scrolled.
  let { children = chevron, ...props }: Props = $props();
</script>

<KindCarouselPrevious aria-label="Previous suggestions" data-agent-hidden="" {...props} {children} />

{#snippet chevron()}
  <!-- Lucide "chevron-left", see THIRD_PARTY_NOTICES.md. -->
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <path d="m15 18-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
{/snippet}
