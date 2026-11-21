<!-- "Answers not sent. Try again." after a submission fails, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Error> = $props();
</script>

{#snippet fallback()}Answers not sent. Try again.{/snippet}

<parts.Error {...props} children={children ?? fallback} />
