<!-- The comment box: a title, the text, Send and its error, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import FeedbackCommentError from "./FeedbackCommentError.svelte";
  import FeedbackCommentSend from "./FeedbackCommentSend.svelte";
  import FeedbackCommentStatus from "./FeedbackCommentStatus.svelte";
  import FeedbackCommentText from "./FeedbackCommentText.svelte";
  import FeedbackTitle from "./FeedbackTitle.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Content> = $props();
</script>

{#snippet fallback()}
  <FeedbackTitle
  /><FeedbackCommentText
  /><div data-feedback-actions="">
    <FeedbackCommentStatus
    /><FeedbackCommentError
    /><FeedbackCommentSend />
  </div>
{/snippet}

<parts.Content {...props} children={children ?? fallback} />
