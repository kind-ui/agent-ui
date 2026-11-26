<!-- The schedule's `label`, unless you pass a `children` snippet. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Title> = $props();
</script>

{#snippet words({ label }: { label: string })}{label}{/snippet}

<parts.Title {...props} children={children ?? words} />
