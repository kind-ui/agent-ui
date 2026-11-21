<!-- Shown while `status` is `"error"`: its mark, its words and Retry, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import ConversationErrorText from "./ConversationErrorText.svelte";
  import ConversationRetry from "./ConversationRetry.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Error> = $props();
</script>

{#snippet content()}
  <parts.ErrorIcon />
  <ConversationErrorText />
  <ConversationRetry />
{/snippet}

<parts.Error {...props} children={children ?? content} />
