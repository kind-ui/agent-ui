import type { Answers, Question } from "@kind-ui/agent-ui";
import type { QuestionCallback } from "@kind-ui/agent-ui/core";

export const deployQuestions: Question[] = [
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

export type Call = {
  action: "submit" | "skip";
  answers: Answers;
  source: string;
  resolve(): void;
  reject(): void;
};

export function questionHost() {
  const calls: Call[] = [];
  const host = { calls, permit: false };
  const answer =
    (action: Call["action"]): QuestionCallback =>
    (answers, details) =>
      new Promise<void>((resolve, reject) =>
        calls.push({ action, answers, source: details.source, resolve, reject }),
      );
  return { host, submit: answer("submit"), skip: answer("skip") };
}
