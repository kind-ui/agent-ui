<!-- Names the list of the chips that don't fit: the `label`. The styles keep it for assistive technology only. -->
<script lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Title> & { children?: Snippet<[{ label: string }]> };

  let { children: content, ...props }: Props = $props();
</script>

<parts.Title {...props}>
  {#snippet children(state: { label: string })}
    {#if content}{@render content(state)}{:else}{state.label}{/if}
  {/snippet}
</parts.Title>
