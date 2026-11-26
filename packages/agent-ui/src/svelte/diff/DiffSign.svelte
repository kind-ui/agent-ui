<!-- "added" or "removed", which the stylesheet shows as `+` or `−`, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Sign> = $props();
</script>

{#snippet fallback({ text }: { text: string })}{text}{/snippet}

<parts.Sign {...props} children={children ?? fallback} />
