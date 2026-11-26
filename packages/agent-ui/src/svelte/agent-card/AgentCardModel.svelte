<!-- The agent's `model`, unless you pass children. Rendered only with one. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Model> = $props();
</script>

{#snippet model({ model }: { model: string })}{model}{/snippet}

<parts.Model {...props} children={children ?? model} />
