<!-- Each count and the cost supplied, unless you pass children. Rendered only when there's one. -->
<script lang="ts">
  import type { ContextRow } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Rows> & { children?: Snippet<[{ rows: ContextRow[] }]> };

  let { children: content, ...props }: Props = $props();
</script>

<parts.Rows {...props}>
  {#snippet children(state: { rows: ContextRow[] })}
    {#if content}{@render content(state)}{:else}
      {#each state.rows as { label, value } (label)}<div><dt>{label}</dt><dd>{value}</dd></div>{/each}
    {/if}
  {/snippet}
</parts.Rows>
