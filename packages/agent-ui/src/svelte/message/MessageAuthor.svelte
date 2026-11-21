<!-- The `author`'s name, unless the message is `continued`. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let props: Omit<ComponentProps<typeof parts.Author>, "children"> = $props();
</script>

<parts.Author {...props}>
  {#snippet children({ name }: { name: string })}{name}{/snippet}
</parts.Author>
