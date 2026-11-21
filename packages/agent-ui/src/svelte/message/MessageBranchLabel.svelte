<!-- Shows the branch, like "2 of 3". -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let props: Omit<ComponentProps<typeof parts.BranchLabel>, "children"> = $props();
</script>

<parts.BranchLabel {...props}>
  {#snippet children({ label }: { label: string })}{label}{/snippet}
</parts.BranchLabel>
