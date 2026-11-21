<!--
  A row's icon, name, line counts and badge, unless you pass children. Its `value` is the row's path. Spaces between
  the parts keep their words apart in the row's accessible name.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Item> = $props();
</script>

{#snippet fallback({ name }: { name: string })}<span data-file-tree-name="">{name}</span>{" "}<parts.Counts />{" "}<parts.Badge
  />{/snippet}

<parts.Item {...props} children={children ?? fallback} />
