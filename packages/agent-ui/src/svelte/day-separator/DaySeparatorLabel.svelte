<!-- The day as a `<time datetime>`: its words, unless you pass a `children` snippet. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Label> = $props();
</script>

{#snippet words({ label }: { label: string })}{label}{/snippet}

<parts.Label {...props} children={children ?? words} />
