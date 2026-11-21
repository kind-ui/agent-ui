<!-- "Couldn't restore. Try again." after a restore fails, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Error> = $props();
</script>

{#if children}
  <parts.Error {...props} {children} />
{:else}
  <parts.Error {...props}>Couldn't restore. Try again.</parts.Error>
{/if}
