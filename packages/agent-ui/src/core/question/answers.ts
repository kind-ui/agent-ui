import type { Answers, Question } from "../../types/index.js";

export const isAnswered = (answer: string | string[] | undefined) =>
  Array.isArray(answer) ? answer.length > 0 : (answer ?? "").trim() !== "";

/** The ids of the required questions with no answer: no value, an empty list or blank text. */
export const missingAnswers = (questions: readonly Question[], answers: Answers): string[] =>
  questions.filter((question) => question.required && !isAnswered(answers[question.id])).map(({ id }) => id);

/**
 * The answers after choosing `value` for `question`: a single choice replaces the answer, a multiple choice toggles
 * `value` in it, and text replaces it. A value that isn't one of a choice's options leaves the answers as they are.
 */
export const applyAnswer = (question: Question, answers: Answers, value: string): Answers => {
  if (question.kind === "text") return { ...answers, [question.id]: value };
  if (!question.options?.some((option) => option.value === value)) return answers;
  if (question.kind === "single") return { ...answers, [question.id]: value };
  const current = answers[question.id];
  const chosen = Array.isArray(current) ? current : [];
  return {
    ...answers,
    [question.id]: chosen.includes(value) ? chosen.filter((item) => item !== value) : [...chosen, value],
  };
};

/** The answer in words: the chosen options' labels in their order, joined with commas, or the trimmed text. */
export const answerText = (question: Question, answer: string | string[] | undefined): string | undefined => {
  if (!isAnswered(answer)) return undefined;
  if (question.kind === "text") return String(answer).trim();
  const chosen = Array.isArray(answer) ? answer : [answer];
  return (question.options ?? [])
    .filter((option) => chosen.includes(option.value))
    .map((option) => option.label)
    .join(", ");
};
