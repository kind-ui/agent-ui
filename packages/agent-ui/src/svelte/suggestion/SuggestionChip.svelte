<!-- A suggestion's button, whose `value` is its `id`. Reads its label and description unless you pass children. -->
<script lang="ts">
  import type { SuggestionItemState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Item> = $props();
</script>

<parts.Item {...props}>
  {#snippet children(state)}
    {#if content}
      {@render content(state)}
    {:else}
      <span data-suggestion-label="">{state.label}</span>{#if state.description !== undefined}{" "}<span
          data-suggestion-description="">{state.description}</span
        >{/if}
    {/if}
  {/snippet}
</parts.Item>
