<!-- The `alt`, unless you pass children. Names the dialog. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Title> = $props();
</script>

{#snippet fallback({ alt }: { alt: string })}{alt}{/snippet}

<parts.Title {...props} children={children ?? fallback} />
