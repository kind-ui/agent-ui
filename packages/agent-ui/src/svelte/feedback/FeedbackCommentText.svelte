<!-- UI SDK's Textarea, unless you pass children, a snippet that gets its props, its placeholder keyed on the rating. -->
<script lang="ts">
  import type { FeedbackCommentTextState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { KindTextarea } from "../internal/textarea/index.js";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.CommentText> = $props();
</script>

<!-- Part state is a proxy that can't be spread. -->
{#snippet fallback(textarea: FeedbackCommentTextState)}
  <KindTextarea
    controller={textarea.controller}
    defaultValue={textarea.defaultValue}
    readOnly={textarea.readOnly}
    placeholder={textarea.placeholder}
    aria-label={textarea["aria-label"]}
    rows={3}
  />
{/snippet}

<parts.CommentText {...props} children={children ?? fallback} />
