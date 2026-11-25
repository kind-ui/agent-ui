<!-- Calls `onUpgrade`. Reads the `upgradeLabel` unless you pass a `children` snippet. Rendered only with `onUpgrade`. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./index.js";

  let { children, ...props }: ComponentProps<typeof parts.Upgrade> = $props();
</script>

{#snippet label({ label }: { label: string })}{label}{/snippet}

<parts.Upgrade {...props} children={children ?? label} />
