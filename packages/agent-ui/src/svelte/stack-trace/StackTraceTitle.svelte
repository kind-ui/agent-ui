<!-- The `label`, else the message's first line with the error's name set apart, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Title> = $props();
</script>

{#snippet fallback({ name, summary }: { name: string | undefined; summary: string })}
  {#if name}<span data-stack-trace-name="">{name}</span>: {summary}{:else}{summary}{/if}
{/snippet}

<parts.Title {...props} children={children ?? fallback} />
