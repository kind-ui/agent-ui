<!-- The message's lines after its first, unless you pass children. Rendered only while there are any. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Message> = $props();
</script>

{#snippet fallback({ text }: { text: string })}{text}{/snippet}

<parts.Message {...props} children={children ?? fallback} />
