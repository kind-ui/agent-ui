<script lang="ts">
  import type { Answers, Question as QuestionData } from "@kind-ui/agent-ui";
  import { Question } from "@/components/ui/svelte/question/index.js";

  const questions: QuestionData[] = [
    {
      id: "env",
      prompt: "Where should it deploy?",
      kind: "single",
      required: true,
      options: [
        { value: "staging", label: "Staging", description: "Safe to break." },
        { value: "prod", label: "Production", description: "Every user sees it." },
      ],
    },
    {
      id: "checks",
      prompt: "Which checks should run first?",
      kind: "multiple",
      options: [
        { value: "unit", label: "Unit tests" },
        { value: "e2e", label: "End-to-end tests" },
      ],
    },
    { id: "notes", prompt: "Anything the reviewers should know?", kind: "text", placeholder: "Optional notes" },
  ];

  let submitted: Answers | undefined = $state.raw();
</script>

<Question
  label="Deploy questions"
  {questions}
  {submitted}
  onSubmit={(answers: Answers) => (submitted = answers)}
  onSkip={() => (submitted = {})}
/>
