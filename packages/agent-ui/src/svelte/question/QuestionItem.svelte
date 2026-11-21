<!-- The question whose `id` is `value`. Without children, it shows its prompt and its choices or text box. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import QuestionChoices from "./QuestionChoices.svelte";
  import QuestionPrompt from "./QuestionPrompt.svelte";
  import QuestionText from "./QuestionText.svelte";

  let { children, ...props }: ComponentProps<typeof parts.Item> = $props();
</script>

{#snippet defaultParts()}
  <QuestionPrompt />
  <QuestionChoices />
  <QuestionText />
{/snippet}

<parts.Item {...props} children={children ?? defaultParts} />
