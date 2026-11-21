import type { Question as QuestionData } from "@kind-ui/agent-ui";
import {
  type QuestionChoicesState,
  type QuestionSummaryItem,
  type QuestionTextState,
  questionPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { type Component, defineComponent, h, type Slot, type VNodeChild } from "vue";
import { KindCheckbox, KindCheckboxGroup, KindCheckboxIndicator } from "./internal/checkbox.js";
import { KindRadio, KindRadioGroup, KindRadioIndicator } from "./internal/radio.js";
import { KindTextarea } from "./internal/textarea.js";

const parts = createParts(questionPrimitive, {
  root: "form",
  item: "fieldset",
  prompt: "legend",
  choices: "div",
  text: "div",
  actions: "div",
  submit: "button",
  skip: "button",
  status: "span",
  "status-icon": "span",
  error: "span",
  summary: "div",
  "summary-icon": "span",
});

// A part whose default slot falls back to `fallback`, as React's default `children` do.
const withDefault = <State, Part extends Component = Component>(
  part: Part,
  name: string,
  fallback: (scope: { state: State }) => VNodeChild,
): Part =>
  defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () => h(part as Component, attrs, { ...slots, default: slots.default ?? (fallback as Slot) });
    },
  }) as unknown as Part;

// The mark shows only while the button's call is pending (controls.css).
const withPendingMark = ({ state }: { state: { label: string } }) => [
  h("span", {
    "data-kind-pending-mark": "",
    "data-status-mark": "",
    "data-status": "running",
    "aria-hidden": "true",
  }),
  state.label,
];

// Lucide's check, as the status mark draws it.
const check = () =>
  h(
    "svg",
    {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "3.5",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
    },
    [h("path", { d: "M20 6 9 17l-5-5" })],
  );

export const QuestionActions = parts.Actions;
export const QuestionStatusIcon = parts.StatusIcon;
export const QuestionSummaryIcon = parts.SummaryIcon;

/** The question's prompt, marked "Required" when it is, unless you fill the slot. */
export const QuestionPrompt = withDefault<{ prompt: string; required: boolean }>(
  parts.Prompt,
  "QuestionPrompt",
  ({ state }) => [
    state.prompt,
    state.required ? [" ", h("span", { "data-question-required": "" }, "Required")] : null,
  ],
);

/** A radio group for a single choice or a checkbox group for a multiple one, unless you fill the slot. */
export const QuestionChoices = withDefault<QuestionChoicesState | { kind?: undefined }>(
  parts.Choices,
  "QuestionChoices",
  ({ state }) => {
    // The slot's state proxy answers reads but not `in`.
    if (!state.kind) return null;
    const options = () =>
      state.options.map((option) =>
        h("label", { key: option.value, "data-question-option": "" }, [
          state.kind === "single"
            ? h(KindRadio, { value: option.value }, () => h(KindRadioIndicator))
            : h(KindCheckbox, { value: option.value }, () => h(KindCheckboxIndicator, null, check)),
          h("span", { "data-question-option-text": "" }, [
            h("span", option.label),
            option.description
              ? h("span", { "data-question-option-description": "" }, option.description)
              : null,
          ]),
        ]),
      );
    return state.kind === "single"
      ? h(
          KindRadioGroup,
          {
            "aria-labelledby": state.labelledBy,
            controller: state.controller,
            defaultValue: state.defaultValue,
            readOnly: state.readOnly,
          },
          options,
        )
      : h(
          KindCheckboxGroup,
          { controller: state.controller, defaultValue: state.defaultValue, readOnly: state.readOnly },
          options,
        );
  },
);

/** A text box for a text question, unless you fill the slot. Enter adds a line; it never submits. */
export const QuestionText = withDefault<QuestionTextState | { controller?: undefined }>(
  parts.Text,
  "QuestionText",
  ({ state }) =>
    state.controller
      ? h(KindTextarea, {
          controller: state.controller,
          defaultValue: state.defaultValue,
          readOnly: state.readOnly,
          placeholder: state.placeholder,
          "aria-label": state.label,
          rows: 3,
        })
      : null,
);

/** Calls `onSubmit`. Reads the `submitLabel` unless you fill the slot. Rendered only while `onSubmit` is set. */
export const QuestionSubmit = withDefault(parts.Submit, "QuestionSubmit", withPendingMark);

/** Calls `onSkip`. Reads the `skipLabel` unless you fill the slot. Rendered only while `onSkip` is set. */
export const QuestionSkip = withDefault(parts.Skip, "QuestionSkip", withPendingMark);

/**
 * "Sending answers" or "Skipping" while the host has them, unless you fill the slot. The pressed button holds the
 * running mark, so the words stand alone.
 */
export const QuestionStatus = withDefault<{ label: string }>(
  parts.Status,
  "QuestionStatus",
  ({ state }) => state.label,
);

/** "Answers not sent. Try again." after a submission fails, unless you fill the slot. */
export const QuestionError = withDefault(parts.Error, "QuestionError", () => "Answers not sent. Try again.");

/** "Answered" with each question and its answer, or "Skipped", unless you fill the slot. */
export const QuestionSummary = withDefault<{ outcome: string; items: QuestionSummaryItem[] }>(
  parts.Summary,
  "QuestionSummary",
  ({ state }) => [
    h("span", { "data-question-outcome": "" }, [h(QuestionSummaryIcon), state.outcome]),
    state.items.length > 0
      ? h(
          "dl",
          state.items.map((item) =>
            h("div", { key: item.id }, [
              h("dt", item.prompt),
              h(
                "dd",
                { "data-empty": item.answer === undefined ? "" : undefined },
                item.answer ?? "No answer",
              ),
            ]),
          ),
        )
      : null,
  ],
);

const itemParts = () => [h(QuestionPrompt), h(QuestionChoices), h(QuestionText)];

/** The question whose `id` is `value`. Without a default slot, it shows its prompt and its choices or text box. */
export const QuestionItem = withDefault(parts.Item, "QuestionItem", itemParts);

const defaultParts = ({ state }: { state: { questions: QuestionData[] } }) => [
  ...state.questions.map((question) => h(QuestionItem, { key: question.id, value: question.id })),
  h(QuestionActions, null, () => [h(QuestionSubmit), h(QuestionSkip), h(QuestionStatus), h(QuestionError)]),
  h(QuestionSummary),
];

/**
 * One question or several in one form, each a fieldset, with Submit and Skip, then the recorded answers in the form's
 * place. A default slot replaces the default parts.
 */
export const Question = withDefault(parts.Root, "Question", defaultParts);
