<!-- How long the response took, like "1 min 12 sec". -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let props: Omit<ComponentProps<typeof parts.Duration>, "children"> = $props();
</script>

<parts.Duration {...props}>
  {#snippet children({ label }: { label: string })}{label}{/snippet}
</parts.Duration>
