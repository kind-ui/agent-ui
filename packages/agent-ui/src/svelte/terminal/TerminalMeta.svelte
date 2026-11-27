<!-- "Waiting for approval" while the approval waits, else the duration as "6 sec", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Meta> = $props();
</script>

{#snippet fallback({ text }: { text: string })}{text}{/snippet}

<parts.Meta {...props} children={children ?? fallback} />
