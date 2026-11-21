<!-- Keeps the image's shape in every phase. Holds the preview, progress, image, error, trigger and Download. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import GeneratedImageError from "./GeneratedImageError.svelte";
  import GeneratedImageProgress from "./GeneratedImageProgress.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Frame> = $props();
</script>

{#snippet fallback()}
  <parts.Preview
  /><parts.Image
  /><GeneratedImageProgress
  /><GeneratedImageError
  /><parts.Trigger
  /><parts.Download />
{/snippet}

<parts.Frame {...props} children={children ?? fallback} />
