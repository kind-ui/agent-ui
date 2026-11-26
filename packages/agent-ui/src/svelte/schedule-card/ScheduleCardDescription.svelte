<!-- The schedule in the host's words, unless you pass a `children` snippet. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Description> = $props();
</script>

{#snippet words({ text }: { text: string })}{text}{/snippet}

<parts.Description {...props} children={children ?? words} />
