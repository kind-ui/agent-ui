<!-- Closes the dialog. Reads "Cancel" unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Cancel> = $props();
</script>

{#if children}
  <parts.Cancel {...props} {children} />
{:else}
  <parts.Cancel {...props}>Cancel</parts.Cancel>
{/if}
