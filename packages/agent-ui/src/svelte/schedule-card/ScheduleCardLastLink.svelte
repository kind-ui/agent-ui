<!-- How the last run ended and when, linked to its `href`, unless you pass a `children` snippet. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.LastLink> = $props();
</script>

{#snippet words({ text }: { text: string })}{text}{/snippet}

<parts.LastLink {...props} children={children ?? words} />
