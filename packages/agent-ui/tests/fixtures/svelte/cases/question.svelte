<script module lang="ts">
  import type { AgentAction } from "@ui-sdk/svelte/agent";
  import { questionHost } from "../../shared/question.js";

  const { host, submit, skip } = questionHost();

  export const variants = ["all", "reduced", "refused"];
  export const allow = (step: AgentAction) => !step.confirm || host.permit;
</script>

<script lang="ts">
  import type { Answers } from "@kind-ui/agent-ui";
  import { Question } from "../../../../src/svelte/question/index.js";
  import { expose } from "../../shared/expose.js";
  import { deployQuestions } from "../../shared/question.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  let submitted: Answers | undefined = $state.raw();
  let value: Answers = $state.raw({ env: "staging" });
  // Svelte keeps an unbound value the component changed until the parent passes another, so the owner refuses
  // through a function binding's setter, as React's owner does by not setting its state.
  let refusing = $state(true);

  expose({
    kindHost: host,
    kindQuestion: { record: (next: Answers | undefined) => (submitted = next) },
    kindRefuse: (next: boolean) => (refusing = next),
  });
</script>

{#if variant === "all" || variant === "reduced"}
  <div class="flex w-[28rem] flex-col gap-4 p-6">
    <p id="above">Above</p>
    <Question
      id="deploy"
      label="Deploy questions"
      questions={deployQuestions}
      {submitted}
      onSubmit={submit}
      onSkip={skip}
      motion={variant === "reduced" ? "reduced" : undefined}
    />
    <p id="below">Below</p>
  </div>
{:else if variant === "refused"}
  <div class="flex w-[28rem] flex-col gap-4 p-6">
    <Question
      id="deploy"
      label="Deploy questions"
      questions={deployQuestions}
      bind:value={
        () => value,
        (next) => {
          if (!refusing) value = next;
        }
      }
      onSubmit={submit}
    />
  </div>
{/if}
