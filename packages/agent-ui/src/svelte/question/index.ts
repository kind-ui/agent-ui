import type { ComponentProps } from "svelte";
import { parts } from "./parts.js";
import Question from "./Question.svelte";
import QuestionChoices from "./QuestionChoices.svelte";
import QuestionError from "./QuestionError.svelte";
import QuestionItem from "./QuestionItem.svelte";
import QuestionPrompt from "./QuestionPrompt.svelte";
import QuestionSkip from "./QuestionSkip.svelte";
import QuestionStatus from "./QuestionStatus.svelte";
import QuestionSubmit from "./QuestionSubmit.svelte";
import QuestionSummary from "./QuestionSummary.svelte";
import QuestionText from "./QuestionText.svelte";

export {
  Question,
  QuestionChoices,
  QuestionError,
  QuestionItem,
  QuestionPrompt,
  QuestionSkip,
  QuestionStatus,
  QuestionSubmit,
  QuestionSummary,
  QuestionText,
};
export const QuestionActions = parts.Actions;
export const QuestionStatusIcon = parts.StatusIcon;
export const QuestionSummaryIcon = parts.SummaryIcon;

export type QuestionProps = ComponentProps<typeof Question>;
export type QuestionItemProps = ComponentProps<typeof QuestionItem>;
export type QuestionPromptProps = ComponentProps<typeof QuestionPrompt>;
export type QuestionChoicesProps = ComponentProps<typeof QuestionChoices>;
export type QuestionTextProps = ComponentProps<typeof QuestionText>;
export type QuestionSubmitProps = ComponentProps<typeof QuestionSubmit>;
export type QuestionSkipProps = ComponentProps<typeof QuestionSkip>;
export type QuestionStatusProps = ComponentProps<typeof QuestionStatus>;
export type QuestionErrorProps = ComponentProps<typeof QuestionError>;
export type QuestionSummaryProps = ComponentProps<typeof QuestionSummary>;
