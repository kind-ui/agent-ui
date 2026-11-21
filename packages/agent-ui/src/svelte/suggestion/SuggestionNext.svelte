<!-- Scrolls on to later suggestions. Put it in `SuggestionControls` to hide it while every suggestion fits. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { KindCarouselNext } from "../internal/carousel/index.js";

  type Props = ComponentProps<typeof KindCarouselNext>;

  // Hidden from agents, as Previous is.
  let { children = chevron, ...props }: Props = $props();
</script>

<KindCarouselNext aria-label="Next suggestions" data-agent-hidden="" {...props} {children} />

{#snippet chevron()}
  <!-- Lucide "chevron-right", see THIRD_PARTY_NOTICES.md. -->
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <path d="m9 18 6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
{/snippet}
