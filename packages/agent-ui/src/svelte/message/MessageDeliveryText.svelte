<!-- "Steered" or "Queued". -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let props: ComponentProps<typeof parts.DeliveryText> & { children?: never } = $props();
</script>

<parts.DeliveryText {...props}>
  {#snippet children({ text })}{text}{/snippet}
</parts.DeliveryText>
