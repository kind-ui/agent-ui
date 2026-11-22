<!-- The question's prompt, marked "Required" when it is, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Prompt> = $props();
</script>

{#snippet defaultPrompt({ prompt, required }: { prompt: string; required: boolean })}
  {prompt}{#if required}{" "}<span data-question-required="">Required</span>{/if}
{/snippet}

<parts.Prompt {...props} children={children ?? defaultPrompt} />
