<!-- The `author`'s name, unless the message is `continued`. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let props: ComponentProps<typeof parts.Author> & { children?: never } = $props();
</script>

<parts.Author {...props}>
  {#snippet children({ name })}{name}{/snippet}
</parts.Author>
