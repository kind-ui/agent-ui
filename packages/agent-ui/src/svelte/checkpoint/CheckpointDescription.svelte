<!-- The `description`, unless you pass children. Rendered only with one. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Description> = $props();
</script>

{#if children}
  <parts.Description {...props} {children} />
{:else}
  <parts.Description {...props}
    >{#snippet children({ description }: { description: string })}{description}{/snippet}</parts.Description
  >
{/if}
