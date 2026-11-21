<!-- The "+N" button, present while some chips don't fit, which opens the list of them. -->
<script lang="ts">
  import type { ContextBarOverflowState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Overflow> & { children?: Snippet<[ContextBarOverflowState]> };

  let { children: content, ...props }: Props = $props();
</script>

<parts.Overflow {...props}>
  {#snippet children(state: ContextBarOverflowState)}
    {#if content}{@render content(state)}{:else}+{state.count}{/if}
  {/snippet}
</parts.Overflow>
