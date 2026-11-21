<!-- The `label`, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Label> = $props();
</script>

{#if children}
  <parts.Label {...props} {children} />
{:else}
  <parts.Label {...props}>{#snippet children({ label }: { label: string })}{label}{/snippet}</parts.Label>
{/if}
