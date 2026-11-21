<!-- The `label`, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Title> = $props();
</script>

{#snippet fallback({ label }: { label: string })}{label}{/snippet}

<parts.Title {...props} children={children ?? fallback} />
