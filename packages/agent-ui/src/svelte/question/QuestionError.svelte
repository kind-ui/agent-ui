<!-- "Answers not sent. Try again." after a submission fails, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Error> = $props();
</script>

<parts.Error {...props}>
  {#if children}{@render children()}{:else}Answers not sent. Try again.{/if}
</parts.Error>
