<!-- Present while `onAccept` is set. "Accept", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Accept> = $props();
</script>

{#snippet fallback()}Accept{/snippet}

<parts.Accept {...props} children={children ?? fallback} />
