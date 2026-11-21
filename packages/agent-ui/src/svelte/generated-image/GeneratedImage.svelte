<!--
  An image the agent is making: a frame of the image's shape that shows its progress and a blurred preview, then
  the image, which opens full size. Any `children` replace the frame and the full size view.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import GeneratedImageDialog from "./GeneratedImageDialog.svelte";
  import GeneratedImageFrame from "./GeneratedImageFrame.svelte";
  import { parts } from "./parts.js";

  let { children, open = $bindable(), ...props }: ComponentProps<typeof parts.Root> = $props();
</script>

{#snippet fallback()}
  <GeneratedImageFrame />
  <parts.Backdrop />
  <GeneratedImageDialog />
{/snippet}

<parts.Root {...props} bind:open children={children ?? fallback} />
