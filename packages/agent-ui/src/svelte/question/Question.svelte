<!--
  One question or several in one form, each a fieldset, with Submit and Skip, then the recorded answers in the form's
  place. Any `children` replace the default parts.
-->
<script lang="ts">
  import type { Question } from "@kind-ui/agent-ui";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import QuestionError from "./QuestionError.svelte";
  import QuestionItem from "./QuestionItem.svelte";
  import QuestionSkip from "./QuestionSkip.svelte";
  import QuestionStatus from "./QuestionStatus.svelte";
  import QuestionSubmit from "./QuestionSubmit.svelte";
  import QuestionSummary from "./QuestionSummary.svelte";

  // `value` is bound through, so `bind:value` reaches the root and an owner can refuse a change in its setter.
  let { children, value = $bindable(), ...props }: ComponentProps<typeof parts.Root> = $props();
</script>

{#snippet defaultParts({ questions }: { questions: Question[] })}
  {#each questions as question (question.id)}
    <QuestionItem value={question.id} />
  {/each}<parts.Actions
  >
    <QuestionSubmit
    /><QuestionSkip
    /><QuestionStatus
    /><QuestionError />
  </parts.Actions
  ><QuestionSummary />
{/snippet}

<parts.Root {...props} bind:value children={children ?? defaultParts} />
