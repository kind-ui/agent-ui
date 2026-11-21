<!-- Opens the dialog. Its `label`, after a share glyph, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Trigger> & { children?: Snippet<[{ label: string }]> };

  let { children: content, ...props }: Props = $props();
</script>

<parts.Trigger {...props}>
  {#snippet children(state: { label: string })}
    {#if content}{@render content(state)}{:else}{state.label}{/if}
  {/snippet}
</parts.Trigger>
