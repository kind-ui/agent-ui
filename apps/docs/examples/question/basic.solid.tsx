import type { Answers, Question as QuestionData } from "@kind-ui/agent-ui";
import { createSignal } from "solid-js";
import { Question } from "@/components/ui/solid/question";

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

export default function QuestionExample() {
  const [submitted, setSubmitted] = createSignal<Answers>();
  return (
    <Question
      label="Deploy questions"
      questions={questions}
      submitted={submitted()}
      onSubmit={(answers) => setSubmitted(answers)}
      onSkip={() => setSubmitted({})}
    />
  );
}
