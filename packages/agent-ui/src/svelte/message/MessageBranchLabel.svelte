<!-- Shows the branch, like "2 of 3". -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let props: ComponentProps<typeof parts.BranchLabel> & { children?: never } = $props();
</script>

<parts.BranchLabel {...props}>
  {#snippet children({ label })}{label}{/snippet}
</parts.BranchLabel>
