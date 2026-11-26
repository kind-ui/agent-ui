<!-- When it happened: its time today, else its date too. Server markup shows the date. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Time> = $props();
</script>

{#snippet fallback({ label }: { label: string })}{label}{/snippet}

<parts.Time {...props} children={children ?? fallback} />
