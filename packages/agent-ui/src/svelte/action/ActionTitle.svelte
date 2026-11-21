<!-- The `label`, else "Action", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Title> = $props();
</script>

{#snippet fallback({ title }: { title: string })}{title}{/snippet}

<parts.Title {...props} children={children ?? fallback} />
