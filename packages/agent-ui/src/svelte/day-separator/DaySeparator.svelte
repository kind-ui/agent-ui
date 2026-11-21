<!-- A heading between days: the date on the server, and "Today", "Yesterday" or a weekday once in the browser. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import DaySeparatorLabel from "./DaySeparatorLabel.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Root> = $props();
</script>

{#snippet label()}<DaySeparatorLabel />{/snippet}

<parts.Root {...props} children={children ?? label} />
