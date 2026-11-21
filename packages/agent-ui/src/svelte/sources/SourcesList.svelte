<!-- An item for each of the `sources`, unless you pass children. -->
<script lang="ts">
  import type { SourcesState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import SourcesItem from "./SourcesItem.svelte";

  let { children, ...props }: ComponentProps<typeof parts.List> = $props();
</script>

{#snippet fallback({ sources }: Pick<SourcesState, "sources">)}
  {#each sources as source (source.id)}
    <SourcesItem value={source.id} />
  {/each}
{/snippet}

<parts.List {...props} children={children ?? fallback} />
