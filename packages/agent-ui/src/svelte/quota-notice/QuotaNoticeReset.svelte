<!-- "Resets in 3 days", unless you pass a `children` snippet. Rendered only with a `resetAt`. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./index.js";

  let { children, ...props }: ComponentProps<typeof parts.Reset> = $props();
</script>

{#snippet reset({ text }: { text: string })}{text}{/snippet}

<parts.Reset {...props} children={children ?? reset} />
