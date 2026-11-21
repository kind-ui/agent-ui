<!-- The `reason`, unless you pass a `children` snippet. Rendered only with a `reason`. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./index.js";

  let { children, ...props }: ComponentProps<typeof parts.Reason> = $props();
</script>

{#snippet reason({ reason }: { reason: string | undefined })}{reason}{/snippet}

<parts.Reason {...props} children={children ?? reason} />
