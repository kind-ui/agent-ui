<!-- The selected span's name, kind, status, start, duration and attributes, with Close, unless you pass children. -->
<script lang="ts">
  import type { TraceDetailsState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Details> = $props();
</script>

{#snippet fallback({ name, rows }: TraceDetailsState)}<div data-trace-details-header=""
    ><p data-trace-details-title="">{name}</p><parts.DetailsClose /></div
  ><dl>{#each rows as { term, detail } (term)}<dt>{term}</dt><dd>{detail}</dd>{/each}</dl>{/snippet}

<parts.Details {...props} children={children ?? fallback} />
