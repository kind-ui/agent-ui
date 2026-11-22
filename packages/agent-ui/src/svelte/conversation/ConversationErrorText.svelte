<!-- The `error` option's words, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.ErrorText> = $props();
</script>

{#snippet text({ error }: { error: string })}{error}{/snippet}

<parts.ErrorText {...props} children={children ?? text} />
