<!-- Shown above the selection, with one `SelectionItem` per action unless you pass children. -->
<script lang="ts">
  import type { SelectionToolbarState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { KindToolbar } from "../internal/toolbar/index.js";
  import { parts } from "./parts.js";
  import SelectionItem from "./SelectionItem.svelte";

  let { children, ...props }: ComponentProps<typeof parts.Toolbar> = $props();
</script>

{#snippet fallback({ label, actions }: SelectionToolbarState)}
  <KindToolbar aria-label={label}>
    {#each actions as action (action.id)}
      <SelectionItem value={action.id} />
    {/each}
  </KindToolbar>
{/snippet}

<parts.Toolbar {...props} children={children ?? fallback} />
