<!-- How long the response took, like "1 min 12 sec". -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let props: ComponentProps<typeof parts.Duration> & { children?: never } = $props();
</script>

<parts.Duration {...props}>
  {#snippet children({ label })}{label}{/snippet}
</parts.Duration>
