<!-- The event's `description` as Markdown, unless you pass children. Rendered only with one. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { Markdown } from "../markdown/index.js";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Description> = $props();
</script>

{#snippet fallback({ description }: { description: string })}<Markdown source={description} />{/snippet}

<parts.Description {...props} children={children ?? fallback} />
