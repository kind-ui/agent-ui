<!-- The retry's `reason`, as a sentence: "Rate limited.". -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let props: ComponentProps<typeof parts.RetryingReason> & { children?: never } = $props();
</script>

<parts.RetryingReason {...props}>
  {#snippet children({ reason })}{reason}{/snippet}
</parts.RetryingReason>
