<!-- "No update for 5 min", while a running status has had no update for `stalledAfter`. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./index.js";

  let props: ComponentProps<typeof parts.Stalled> & { children?: never } = $props();
</script>

<parts.Stalled {...props}>
  {#snippet children({ text })}{text}{/snippet}
</parts.Stalled>
