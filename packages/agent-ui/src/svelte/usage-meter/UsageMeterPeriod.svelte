<!-- The `period` and the countdown to `resetAt`, unless you pass children. Rendered only with one of them. -->
<script lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Period> & { children?: Snippet<[{ text: string }]> };

  let { children: content, ...props }: Props = $props();
</script>

<parts.Period {...props}>
  {#snippet children(state: { text: string })}
    {#if content}{@render content(state)}{:else}{state.text}{/if}
  {/snippet}
</parts.Period>
