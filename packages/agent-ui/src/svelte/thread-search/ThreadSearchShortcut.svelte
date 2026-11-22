<!-- The `shortcut`'s keys as this platform shows them, like `⌘K`, unless you pass children. Present only with one. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Shortcut>;

  let { children: content, ...props }: Props = $props();
</script>

<parts.Shortcut {...props}>
  {#snippet children(state: { text: string })}
    {#if content}{@render content(state)}{:else}{state.text}{/if}
  {/snippet}
</parts.Shortcut>
