import { type QuestionChoicesState, type QuestionTextState, questionPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, Match, omit, Show, Switch } from "solid-js";
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

// Reads `children` once and builds the default only when used, since JSX builds its elements as it runs.
const or = <T,>(children: T | undefined, fallback: () => T): T =>
  children === undefined ? fallback() : children;

type Single = Extract<QuestionChoicesState, { kind: "single" }>;
type Multiple = Extract<QuestionChoicesState, { kind: "multiple" }>;

export type QuestionProps = ComponentProps<typeof parts.Root>;

/**
 * One question or several in one form, each a fieldset, with Submit and Skip, then the recorded answers in the form's
 * place. Any `children` replace the default parts.
 */
export function Question(props: QuestionProps) {
  return (
    <parts.Root {...omit(props, "children")}>
      {or(props.children, () => (state: { questions: { id: string }[] }) => (
        <>
          <For each={state.questions} keyed={(question) => question.id}>
            {(question) => <QuestionItem value={question().id} />}
          </For>
          <QuestionActions>
            <QuestionSubmit />
            <QuestionSkip />
            <QuestionStatus />
            <QuestionError />
          </QuestionActions>
          <QuestionSummary />
        </>
      ))}
    </parts.Root>
  );
}

export const QuestionActions = parts.Actions;
export const QuestionStatusIcon = parts.StatusIcon;
export const QuestionSummaryIcon = parts.SummaryIcon;

export type QuestionItemProps = ComponentProps<typeof parts.Item>;

/** The question whose `id` is `value`. Without children, it shows its prompt and its choices or text box. */
export function QuestionItem(props: QuestionItemProps) {
  return (
    <parts.Item {...omit(props, "children")}>
      {or(props.children, () => (
        <>
          <QuestionPrompt />
          <QuestionChoices />
          <QuestionText />
        </>
      ))}
    </parts.Item>
  );
}

export type QuestionPromptProps = ComponentProps<typeof parts.Prompt>;

/** The question's prompt, marked "Required" when it is, unless you pass children. */
export function QuestionPrompt(props: QuestionPromptProps) {
  return (
    <parts.Prompt {...omit(props, "children")}>
      {or(props.children, () => (state: { prompt: string; required: boolean }) => (
        <>
          {state.prompt}
          <Show when={state.required}>
            {" "}
            <span data-question-required="">Required</span>
          </Show>
        </>
      ))}
    </parts.Prompt>
  );
}

export type QuestionChoicesProps = ComponentProps<typeof parts.Choices>;

/** A radio group for a single choice or a checkbox group for a multiple one, unless you pass children. */
export function QuestionChoices(props: QuestionChoicesProps) {
  return (
    <parts.Choices {...omit(props, "children")}>
      {or(props.children, () => (state: Partial<QuestionChoicesState>) => {
        const options = () => (
          <For each={state.options} keyed={(option) => option.value}>
            {(option) => (
              // biome-ignore lint/a11y/noLabelWithoutControl: the label wraps UI SDK's radio or checkbox, which it names.
              <label data-question-option="">
                <Show
                  when={state.kind === "single"}
                  fallback={
                    <KindCheckbox value={option().value}>
                      <KindCheckboxIndicator>
                        <Check />
                      </KindCheckboxIndicator>
                    </KindCheckbox>
                  }
                >
                  <KindRadio value={option().value}>
                    <KindRadioIndicator />
                  </KindRadio>
                </Show>
                <span data-question-option-text="">
                  <span>{option().label}</span>
                  <Show when={option().description}>
                    <span data-question-option-description="">{option().description}</span>
                  </Show>
                </span>
              </label>
            )}
          </For>
        );
        return (
          <Switch>
            <Match when={state.kind === "single"}>
              <KindRadioGroup
                aria-labelledby={(state as Single).labelledBy}
                controller={(state as Single).controller}
                defaultValue={(state as Single).defaultValue}
                readOnly={(state as Single).readOnly}
              >
                {options()}
              </KindRadioGroup>
            </Match>
            <Match when={state.kind === "multiple"}>
              <KindCheckboxGroup
                controller={(state as Multiple).controller}
                defaultValue={(state as Multiple).defaultValue}
                readOnly={(state as Multiple).readOnly}
              >
                {options()}
              </KindCheckboxGroup>
            </Match>
          </Switch>
        );
      })}
    </parts.Choices>
  );
}

export type QuestionTextProps = ComponentProps<typeof parts.Text>;

/** A text box for a text question, unless you pass children. Enter adds a line; it never submits. */
export function QuestionText(props: QuestionTextProps) {
  return (
    <parts.Text {...omit(props, "children")}>
      {or(props.children, () => (state: Partial<QuestionTextState>) => (
        <Show when={state.controller}>
          <KindTextarea
            controller={state.controller}
            defaultValue={state.defaultValue}
            readonly={state.readOnly}
            placeholder={state.placeholder}
            aria-label={state.label}
            rows={3}
          />
        </Show>
      ))}
    </parts.Text>
  );
}

export type QuestionSubmitProps = ComponentProps<typeof parts.Submit>;

/** Calls `onSubmit`. Reads the `submitLabel` unless you pass children. Rendered only while `onSubmit` is set. */
export function QuestionSubmit(props: QuestionSubmitProps) {
  return (
    <parts.Submit {...omit(props, "children")}>{or(props.children, () => withPendingMark)}</parts.Submit>
  );
}

export type QuestionSkipProps = ComponentProps<typeof parts.Skip>;

/** Calls `onSkip`. Reads the `skipLabel` unless you pass children. Rendered only while `onSkip` is set. */
export function QuestionSkip(props: QuestionSkipProps) {
  return <parts.Skip {...omit(props, "children")}>{or(props.children, () => withPendingMark)}</parts.Skip>;
}

export type QuestionStatusProps = ComponentProps<typeof parts.Status>;

/**
 * "Sending answers" or "Skipping" while the host has them, unless you pass children. The pressed button holds the
 * running mark, so the words stand alone.
 */
export function QuestionStatus(props: QuestionStatusProps) {
  return (
    <parts.Status {...omit(props, "children")}>
      {or(props.children, () => (state: { label: string }) => state.label)}
    </parts.Status>
  );
}

export type QuestionErrorProps = ComponentProps<typeof parts.Error>;

/** "Answers not sent. Try again." after a submission fails, unless you pass children. */
export function QuestionError(props: QuestionErrorProps) {
  return (
    <parts.Error {...omit(props, "children")}>
      {or(props.children, () => "Answers not sent. Try again.")}
    </parts.Error>
  );
}

export type QuestionSummaryProps = ComponentProps<typeof parts.Summary>;

/** "Answered" with each question and its answer, or "Skipped", unless you pass children. */
export function QuestionSummary(props: QuestionSummaryProps) {
  return (
    <parts.Summary {...omit(props, "children")}>
      {or(props.children, () => (state) => (
        <>
          <span data-question-outcome="">
            <QuestionSummaryIcon />
            {state.outcome}
          </span>
          <Show when={state.items.length > 0}>
            <dl>
              <For each={state.items} keyed={(item) => item.id}>
                {(item) => (
                  <div>
                    <dt>{item().prompt}</dt>
                    <dd data-empty={item().answer === undefined ? "" : undefined}>
                      {item().answer ?? "No answer"}
                    </dd>
                  </div>
                )}
              </For>
            </dl>
          </Show>
        </>
      ))}
    </parts.Summary>
  );
}

// The mark shows only while the button's call is pending (controls.css).
const withPendingMark = (state: { label: string }): JSX.Element => (
  <>
    <span data-kind-pending-mark="" data-status-mark="" data-status="running" aria-hidden="true" />
    {state.label}
  </>
);

// Lucide's check, as the status mark draws it.
function Check() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="3.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
