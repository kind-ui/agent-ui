<!-- How full, like "86% full · Filling up", unless you pass children. Names the details. -->
<script lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { parts } from "./parts.js";

  type TitleState = { label: string; fullText: string; levelText: string };
  type Props = ComponentProps<typeof parts.Title> & { children?: Snippet<[TitleState]> };

  let { children: content, ...props }: Props = $props();
</script>

<parts.Title {...props}>
  {#snippet children(state: TitleState)}
    {#if content}{@render content(state)}{:else}{state.fullText}{#if state.levelText}<span
          data-context-meter-level="">{` · ${state.levelText}`}</span
        >{/if}{/if}
  {/snippet}
</parts.Title>
