<!-- "<from> handed off to <to>", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Text> = $props();
</script>

{#snippet fallback({ text }: { text: string })}{text}{/snippet}

<parts.Text {...props} children={children ?? fallback} />
