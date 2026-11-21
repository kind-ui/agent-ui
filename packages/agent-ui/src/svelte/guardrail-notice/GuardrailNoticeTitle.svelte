<!-- The `label`, else "Response blocked" or "Response filtered", unless you pass a `children` snippet. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./index.js";

  let { children, ...props }: ComponentProps<typeof parts.Title> = $props();
</script>

{#snippet label({ label }: { label: string })}{label}{/snippet}

<parts.Title {...props} children={children ?? label} />
