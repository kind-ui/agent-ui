<!--
  Thumbs up and down for a response, then "Add a comment" while `onComment` is set, which opens a box to write one.
  Any `children` replace the default parts.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import FeedbackComment from "./FeedbackComment.svelte";
  import FeedbackContent from "./FeedbackContent.svelte";
  import FeedbackThanks from "./FeedbackThanks.svelte";
  import FeedbackThumbs from "./FeedbackThumbs.svelte";
  import { parts } from "./parts.js";

  let {
    children,
    rating = $bindable(),
    open = $bindable(),
    ...props
  }: ComponentProps<typeof parts.Root> = $props();
</script>

{#snippet fallback()}
  <FeedbackThumbs />
  <FeedbackComment />
  <FeedbackThanks />
  <FeedbackContent />
{/snippet}

<parts.Root {...props} bind:rating bind:open children={children ?? fallback} />
