<!-- The full size view: the image, its `alt` as the title, Download and Close, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import GeneratedImageClose from "./GeneratedImageClose.svelte";
  import GeneratedImageTitle from "./GeneratedImageTitle.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Content> = $props();
</script>

{#snippet fallback()}
  <parts.FullImage />
  <div data-generated-image-actions="">
    <GeneratedImageTitle />
    <parts.Download>Download</parts.Download>
    <GeneratedImageClose />
  </div>
{/snippet}

<parts.Content {...props} children={children ?? fallback} />
