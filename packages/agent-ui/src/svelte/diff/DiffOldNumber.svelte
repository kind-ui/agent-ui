<!-- The line's number in the old file, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.OldNumber> = $props();
</script>

{#snippet fallback({ text }: { text: string })}{text}{/snippet}

<parts.OldNumber {...props} children={children ?? fallback} />
