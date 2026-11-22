<!-- Shows the next source. -->
<script lang="ts">
  import { CarouselNext } from "@ui-sdk/svelte/carousel";
  import type { ComponentProps } from "svelte";

  let { children = chevron, ...props }: ComponentProps<typeof CarouselNext> = $props();
</script>

<CarouselNext aria-label="Next source" data-agent-hidden="" data-kind-icon-button="" {...props} {children} />

{#snippet chevron()}
  <!-- Lucide "chevron-right", see THIRD_PARTY_NOTICES.md. -->
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <path d="m9 18 6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
{/snippet}
