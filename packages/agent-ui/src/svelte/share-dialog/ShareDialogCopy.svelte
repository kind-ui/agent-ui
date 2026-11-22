<!-- Copies the `link`. "Copy link", then "Copied" for 2 s, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Copy> & { children?: Snippet<[{ copied: boolean }]> };

  let { children: content, ...props }: Props = $props();
</script>

<parts.Copy {...props}>
  {#snippet children(state: { copied: boolean })}
    {#if content}{@render content(state)}{:else}{state.copied ? "Copied" : "Copy link"}{/if}
  {/snippet}
</parts.Copy>
