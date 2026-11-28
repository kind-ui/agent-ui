<!-- "from old/path.ts" for a rename, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.FileOldPath> = $props();
</script>

{#snippet fallback({ text }: { text: string })}<bdi>{text}</bdi>{/snippet}

<parts.FileOldPath {...props} children={children ?? fallback} />
