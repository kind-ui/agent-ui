<!-- Why the change's decision failed, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.ChangeError> = $props();
</script>

{#snippet fallback({ text }: { text: string })}{text}{/snippet}

<parts.ChangeError {...props} children={children ?? fallback} />
