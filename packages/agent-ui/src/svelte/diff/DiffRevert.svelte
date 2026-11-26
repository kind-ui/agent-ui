<!-- Present while `onRevert` is set. "Revert", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Revert> = $props();
</script>

{#snippet fallback()}Revert{/snippet}

<parts.Revert {...props} children={children ?? fallback} />
