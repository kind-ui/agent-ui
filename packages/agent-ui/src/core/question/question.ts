import {
  type ActionDetails,
  announce,
  type ChangeDetails,
  createChange,
  createFocusRecovery,
  definePrimitive,
  type SlotDefinition,
  selects,
} from "@ui-sdk/core";
import { type CheckboxGroupController, createCheckboxGroupController } from "@ui-sdk/core/checkbox";
import { createInputController, type InputController } from "@ui-sdk/core/input";
import { createRadioGroupController, type RadioGroupController } from "@ui-sdk/core/radio";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { Answers, Question, QuestionOption } from "../../types/index.js";
import { actionSource } from "../action-source.js";
import { memo } from "../memo.js";
import { enter, type MotionMode } from "../motion/index.js";
import { createPendingAction } from "../pending.js";
import { answerOf, answerText, applyAnswer, isAnswered, missingAnswers } from "./answers.js";

/** `"input-change"`: a person chose an option or typed. `"imperative"`: an `api` call, like an agent's `select`. */
export type QuestionValueChangeReason = "input-change" | "imperative";

/**
 * Called with the answers. Return a promise to keep the form locked until it settles: a rejection unlocks it and
 * keeps every answer. `details.source` says who acted, like `"mouse"`, `"keyboard"` or `"agent"`.
 */
export type QuestionCallback = (answers: Answers, details: ActionDetails) => unknown;

export type QuestionOptions = {
  /** The questions, in order, each its own fieldset in one form. Defaults to none. */
  questions?: Question[];
  /** The answers by question id. Passing it controls them: change them in `onValueChange`. Don't pass it with `defaultValue`. */
  value?: Answers;
  /** The answers at first, when `value` isn't passed. */
  defaultValue?: Answers;
  /** Called when an answer changes, with what caused it. Cancel `details` to refuse the change. */
  onValueChange?: (value: Answers, details: ChangeDetails<QuestionValueChangeReason>) => void;
  /** Called with the answers when they're sent. Shows Submit while set, available once every required question has an answer. */
  onSubmit?: QuestionCallback;
  /** Called with the answers so far when the questions are skipped. Shows Skip while set. */
  onSkip?: QuestionCallback;
  /**
   * The answers the host recorded, shown read-only in the form's place. Until it's set, a sent or skipped form stays
   * locked; pass `{}` for skipped questions.
   */
  submitted?: Answers;
  /**
   * Names the form, like "Deploy questions".
   * @default "Questions"
   */
  label?: string;
  /** @default "Submit" */
  submitLabel?: string;
  /** @default "Skip" */
  skipLabel?: string;
  /**
   * Whether an agent's `submit` and `skip` wait for a person to confirm (spec §6).
   * @default true
   */
  agentConfirm?: boolean;
  /**
   * How new questions and the summary fade in. `"auto"` follows `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type QuestionState = {
  /** The `label`, else "Questions". */
  label: string;
  /** The `questions` option. */
  questions: Question[];
  /** The questions by id, so a question's update reaches only its own parts. */
  questionsById: Record<string, Question>;
  /** The answers; the owner's `value` when controlled. */
  value: Answers;
  /** The `submitted` option. */
  submitted: Answers | undefined;
  /** Whether a promise `onSubmit` or `onSkip` returned is still pending. */
  pending: boolean;
  /** Whether the answers were sent or skipped and the host hasn't passed `submitted` yet. */
  sent: boolean;
  /** Whether the last submission failed, so the error shows. */
  failed: boolean;
  /** The button that was pressed, while its call is pending or sent. */
  pressed: "submit" | "skip" | undefined;
  /** Whether `onSubmit` is set. */
  canSubmit: boolean;
  /** Whether `onSkip` is set. */
  canSkip: boolean;
  /** The `submitLabel`, else "Submit". */
  submitLabel: string;
  /** The `skipLabel`, else "Skip". */
  skipLabel: string;
  /** The `agentConfirm` option. */
  agentConfirm: boolean;
  /** The `motion` option. */
  motion: MotionMode;
};

/** What a choice group's render function gets: pass `controller`, `defaultValue` and `readOnly` to the group. */
export type QuestionChoicesState =
  | {
      kind: "single";
      options: QuestionOption[];
      controller: RadioGroupController;
      defaultValue: string | null;
      readOnly: boolean;
    }
  | {
      kind: "multiple";
      options: QuestionOption[];
      controller: CheckboxGroupController;
      defaultValue: string[];
      readOnly: boolean;
    };

/** What a text answer's render function gets: pass all but `label` to the Textarea, and name it with `label`. */
export type QuestionTextState = {
  controller: InputController;
  defaultValue: string;
  readOnly: boolean;
  placeholder: string | undefined;
  /** The question's prompt. */
  label: string;
};

export type QuestionSummaryItem = { id: string; prompt: string; answer: string | undefined };

export type QuestionApi = {
  /**
   * Chooses `value` for a single or multiple choice question, toggling it in a multiple one. Returns `false` for an
   * unknown question or option, a text question, or while the form is locked.
   */
  select: (questionId: string, value: string) => boolean;
  /** Writes a text question's answer. Returns `false` for an unknown or choice question, or while the form is locked. */
  setText: (questionId: string, text: string) => boolean;
  /** Calls `onSubmit`. Offered only while it's set, every required question has an answer and nothing is pending. */
  readonly submit: (() => void) | undefined;
  /** Calls `onSkip`. Offered only while it's set and nothing is pending. */
  readonly skip: (() => void) | undefined;
  /** The answers. */
  getValue: () => Answers;
  /**
   * Replaces the answers, as `onValueChange` reports with `"imperative"`. Returns `false` when the change was
   * canceled, or while the form is locked or answered.
   */
  setValue: (answers: Answers) => boolean;
  /** The `questions`. */
  getQuestions: () => Question[];
  /** Submits or skips as a press does. Called by the root, submit and skip slots. */
  press: (action: "submit" | "skip", event?: Event) => void;
  /** Takes a person's answer from the question's group or text box. Called by the choices and text slots. */
  readAnswer: (questionId: string, event: Event) => void;
  /** Writes the answers into every group and text box whose controller is attached. Web calls it as they arrive. */
  syncAnswers: () => void;
  /** Hands a choice group its props. */
  choicesState: (questionId: string, state: QuestionState) => QuestionChoicesState | undefined;
  /** Hands a text box its props. */
  textState: (questionId: string, state: QuestionState) => QuestionTextState | undefined;
  /** The summary's outcome and each question with its answer in words. */
  summaryState: (state: QuestionState) => { outcome: string; items: QuestionSummaryItem[] };
  /** Moves focus to the summary when Submit or Skip leaves while focused. */
  recovery: ReturnType<typeof createFocusRecovery>;
  /** Fades in a question added after the first frame. Called by the item slot. */
  bindQuestion: (el: HTMLElement, questionId: string) => void;
  /** Fades in the summary when it replaces the form after the first frame. Called by the summary slot. */
  enterSummary: (el: HTMLElement) => void;
  /** Starts counting questions as new after the first frame. Called by the root slot. */
  bindRoot: () => () => void;
};

type Slot<
  Props extends BaseSlotProps = BaseSlotProps,
  Public extends object = Record<never, never>,
> = SlotDefinition<QuestionState, QuestionApi, Props, Public>;

type QuestionProps = { value: string } & BaseSlotProps;
type QuestionPartProps = { value?: string } & BaseSlotProps;

type QuestionSlots = {
  root: Slot<BaseSlotProps, { questions: Question[] }>;
  item: Slot<QuestionProps, { kind: Question["kind"] }>;
  prompt: Slot<QuestionPartProps, { prompt: string; required: boolean }>;
  choices: Slot<QuestionPartProps, QuestionChoicesState | Record<never, never>>;
  text: Slot<QuestionPartProps, QuestionTextState | Record<never, never>>;
  actions: Slot;
  submit: Slot<BaseSlotProps, { label: string }>;
  skip: Slot<BaseSlotProps, { label: string }>;
  status: Slot<BaseSlotProps, { label: string }>;
  "status-icon": Slot;
  error: Slot;
  summary: Slot<BaseSlotProps, { outcome: string; items: QuestionSummaryItem[] }>;
  "summary-icon": Slot;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type QuestionPrimitive = ReturnType<
  typeof definePrimitive<QuestionOptions, QuestionState, QuestionApi, QuestionSlots>
>;

type Control =
  | { kind: "single"; controller: RadioGroupController; initial: string | null }
  | { kind: "multiple"; controller: CheckboxGroupController; initial: string[] }
  | { kind: "text"; controller: InputController; initial: string };

const noQuestions: Question[] = [];
const noAnswers: Answers = {};

const byId = memo((questions: Question[]) =>
  Object.fromEntries(questions.map((question) => [question.id, question])),
);
// Ids are host data, so one like `toString` must not find `Object`'s own.
const questionOf = (state: QuestionState, id: string): Question | undefined =>
  Object.hasOwn(state.questionsById, id) ? state.questionsById[id] : undefined;
const missingOf = memo(missingAnswers);
const keyOf = (questions: readonly Question[]) => questions.map((question) => question.id).join("\n");

// Reads `options` by name rather than spreading it: on Web Components, `@ui-sdk/web` fills in the callbacks on read.
const presentation = (options: QuestionOptions) => {
  const questions = options.questions ?? noQuestions;
  return {
    label: options.label ?? "Questions",
    questions,
    questionsById: byId(questions),
    submitted: options.submitted,
    canSubmit: options.onSubmit !== undefined,
    canSkip: options.onSkip !== undefined,
    submitLabel: options.submitLabel ?? "Submit",
    skipLabel: options.skipLabel ?? "Skip",
    agentConfirm: options.agentConfirm ?? true,
    motion: options.motion ?? "auto",
  };
};

const isLocked = (state: QuestionState) => state.pending || state.sent;
const isAnswering = (state: QuestionState) => state.submitted === undefined;

const sameAnswer = (a: string | string[] | null | undefined, b: string | string[] | null | undefined) =>
  Array.isArray(a) && Array.isArray(b)
    ? a.length === b.length && a.every((item, index) => item === b[index])
    : (a ?? null) === (b ?? null);

// A question's parts hear only about their own question and answer.
const ownQuestion = selects<QuestionState, QuestionApi, QuestionPartProps>({
  questionsById: ({ key }) => [key],
  value: ({ key }) => [key],
  questions: [],
  label: [],
});

const fromQuestion = { value: { kind: "string", from: "item" } } as const;

const noState = {};
const promptId = (id: string, questionId: string) => `${id}-prompt-${encodeURIComponent(questionId)}`;
const rootState = memo((questions: Question[]) => ({ questions }));
const labelStates = new Map<string, { label: string }>();
const labelState = (label: string) => {
  let state = labelStates.get(label);
  if (!state) {
    state = { label };
    labelStates.set(label, state);
  }
  return state;
};
const promptStates = new WeakMap<Question, { prompt: string; required: boolean }>();
const noPrompt = { prompt: "", required: false };
const promptState = (question: Question | undefined) => {
  if (!question) return noPrompt;
  let state = promptStates.get(question);
  if (!state) {
    state = { prompt: question.prompt, required: question.required ?? false };
    promptStates.set(question, state);
  }
  return state;
};

const hasAnswers = (answers: Answers | undefined) => Object.values(answers ?? noAnswers).some(isAnswered);

const summaryOutcome = (submitted: Answers | undefined) => (hasAnswers(submitted) ? "Answered" : "Skipped");

type TextControl = Extract<Control, { kind: "text" }>;

const noOptions: QuestionOption[] = [];

const choicesOf = (
  current: Control,
  options: QuestionOption[],
  readOnly: boolean,
): QuestionChoicesState | undefined =>
  current.kind === "single"
    ? { kind: "single", options, controller: current.controller, defaultValue: current.initial, readOnly }
    : current.kind === "multiple"
      ? { kind: "multiple", options, controller: current.controller, defaultValue: current.initial, readOnly }
      : undefined;

const textOf = (
  current: TextControl,
  placeholder: string | undefined,
  label: string,
  readOnly: boolean,
): QuestionTextState => ({
  controller: current.controller,
  defaultValue: current.initial,
  readOnly,
  placeholder,
  label,
});

export const questionPrimitive: QuestionPrimitive = definePrimitive<
  QuestionOptions,
  QuestionState,
  QuestionApi,
  QuestionSlots
>({
  name: "kind-question",
  options: {
    questions: "value",
    value: "value",
    defaultValue: "value",
    onValueChange: "callback",
    onSubmit: "action",
    onSkip: "action",
    submitted: "value",
    label: "string",
    submitLabel: "string",
    skipLabel: "string",
    agentConfirm: "boolean",
    motion: "string",
  },
  state: (options) => {
    if (options.value !== undefined && options.defaultValue !== undefined) {
      throw new TypeError("Question: value and defaultValue are mutually exclusive");
    }
    return {
      ...presentation(options),
      value: options.value ?? options.defaultValue ?? noAnswers,
      pending: false,
      sent: false,
      failed: false,
      pressed: undefined,
    };
  },
  sync: (options) => ({
    ...presentation(options),
    ...(options.value === undefined ? {} : { value: options.value }),
  }),
  controlled: ["value"],
  api: (context) => {
    const { store } = context;
    const change = createChange(context);
    const pending = createPendingAction(context, {
      state: "pending",
      key: () => keyOf(store.get().questions),
    });
    const controls = new Map<string, Control>();
    const known = new Set(store.get().questions.map((question) => question.id));
    let mounting = true;
    let reported = { key: keyOf(store.get().questions), submitted: store.get().submitted };

    context.onOptions((options) => {
      const key = keyOf(options.questions ?? noQuestions);
      const { submitted } = options;
      if (key === reported.key && submitted === reported.submitted) return;
      const answered = submitted !== undefined && reported.submitted === undefined;
      if (key !== reported.key) forget(options);
      reported = { key, submitted };
      // Spec §4.1: the lock holds until the host records the answers or replaces the questions.
      pending.release();
      store.set({ sent: false, failed: false, pressed: undefined });
      if (answered && !mounting) announce(summaryOutcome(submitted), { priority: "polite" });
    });

    // New questions start a new round: answers and controllers for questions that left are dropped.
    const forget = (options: QuestionOptions) => {
      const ids = new Set((options.questions ?? noQuestions).map((question) => question.id));
      for (const id of controls.keys()) if (!ids.has(id)) controls.delete(id);
      if (options.value !== undefined) return;
      const { value } = store.get();
      const kept = Object.entries(value).filter(([id]) => ids.has(id));
      if (kept.length < Object.keys(value).length)
        change("value", Object.fromEntries(kept), { reason: "imperative" });
    };

    const control = (question: Question): Control => {
      const existing = controls.get(question.id);
      if (existing?.kind === question.kind) return existing;
      const answer = answerOf(store.get().value, question.id);
      const created: Control =
        question.kind === "single"
          ? {
              kind: "single",
              controller: createRadioGroupController(),
              initial: typeof answer === "string" ? answer : null,
            }
          : question.kind === "multiple"
            ? {
                kind: "multiple",
                controller: createCheckboxGroupController(),
                initial: Array.isArray(answer) ? answer : [],
              }
            : {
                kind: "text",
                controller: createInputController(),
                initial: typeof answer === "string" ? answer : "",
              };
      controls.set(question.id, created);
      return created;
    };

    const syncAnswers = () => {
      const { questions, value } = store.get();
      for (const question of questions) {
        const current = controls.get(question.id);
        if (!current || current.kind !== question.kind) continue;
        const answer = answerOf(value, question.id);
        // A controller reads `undefined` until its group or text box attaches it.
        const shown = current.controller.getValue() as string | string[] | null | undefined;
        if (shown === undefined) continue;
        if (current.kind === "single") {
          const next = typeof answer === "string" ? answer : null;
          if (!sameAnswer(shown, next)) current.controller.setValue(next);
        } else if (current.kind === "multiple") {
          const next = Array.isArray(answer) ? answer : [];
          if (!sameAnswer(shown, next)) current.controller.setValue(next);
        } else {
          const next = typeof answer === "string" ? answer : "";
          if (shown !== next) current.controller.setValue(next);
        }
      }
    };
    store.subscribe(syncAnswers);
    let resync = 0;
    context.onDestroy(() => cancelAnimationFrame(resync));

    const write = (
      questionId: string,
      answer: string | string[] | null,
      details: { reason: QuestionValueChangeReason; event?: Event },
    ) => {
      const { value } = store.get();
      if (sameAnswer(answerOf(value, questionId), answer)) return true;
      const next =
        answer === null
          ? Object.fromEntries(Object.entries(value).filter(([id]) => id !== questionId))
          : { ...value, [questionId]: answer };
      return change("value", next, details);
    };

    const editable = (questionId: string, kinds: Question["kind"][]) => {
      const state = store.get();
      const question = questionOf(state, questionId);
      return question && kinds.includes(question.kind) && isAnswering(state) && !isLocked(state)
        ? question
        : undefined;
    };

    const run = (action: "submit" | "skip", event?: Event) => {
      const options = context.options();
      const callback = action === "submit" ? options.onSubmit : options.onSkip;
      const state = store.get();
      if (!callback || !isAnswering(state) || isLocked(state)) return;
      if (action === "submit" && missingOf(state.questions, state.value).length > 0) return;
      const details = { source: actionSource(event, `${action}-press`) };
      const asked = reported;
      // Before the call, so a host that records the answers inside it clears the mark.
      store.set({ pressed: action, failed: false });
      void pending
        .run(() => callback(state.value, details))
        ?.then((outcome) => {
          if (outcome === "stale") return;
          if (outcome === "done" && reported === asked) return store.set({ sent: true });
          store.set({ pressed: undefined, failed: outcome === "failed" });
          if (outcome === "failed") announce("Answers not sent", { priority: "polite" });
        });
    };

    const offered = (action: "submit" | "skip") => {
      const state = store.get();
      const able =
        action === "submit"
          ? state.canSubmit && missingOf(state.questions, state.value).length === 0
          : state.canSkip;
      return able && isAnswering(state) && !isLocked(state);
    };

    const choiceStates = new Map<string, typeof choicesOf>();
    const textStates = new Map<string, typeof textOf>();
    const summary = memo((submitted: Answers | undefined, questions: Question[]) => ({
      outcome: summaryOutcome(submitted),
      // A skip lists nothing: every answer would read "No answer".
      items: (hasAnswers(submitted) ? questions : noQuestions).map((question) => ({
        id: question.id,
        prompt: question.prompt,
        answer: answerText(question, submitted && answerOf(submitted, question.id)),
      })),
    }));

    return {
      select: (questionId, value) => {
        const question = editable(questionId, ["single", "multiple"]);
        if (!question) return false;
        const next = applyAnswer(question, store.get().value, value);
        if (next === store.get().value) return false;
        return write(questionId, answerOf(next, questionId) ?? null, { reason: "imperative" });
      },
      setText: (questionId, text) => {
        if (!editable(questionId, ["text"])) return false;
        return write(questionId, text, { reason: "imperative" });
      },
      get submit() {
        return offered("submit") ? () => run("submit") : undefined;
      },
      get skip() {
        return offered("skip") ? () => run("skip") : undefined;
      },
      getValue: () => store.get().value,
      setValue: (answers) => {
        const state = store.get();
        return isAnswering(state) && !isLocked(state) && change("value", answers, { reason: "imperative" });
      },
      getQuestions: () => store.get().questions,
      press: run,
      readAnswer: (questionId, event) => {
        const current = controls.get(questionId);
        if (!current) return;
        const answer =
          current.kind === "text"
            ? (event.target as HTMLTextAreaElement).value
            : current.controller.getValue();
        // A change the owner cancels is written back, and so is one a controlling owner didn't take by the next
        // frame: the groups and text boxes hold their own value.
        if (!write(questionId, answer, { reason: "input-change", event })) syncAnswers();
        else if (context.options().value !== undefined) {
          cancelAnimationFrame(resync);
          resync = requestAnimationFrame(syncAnswers);
        }
      },
      syncAnswers,
      choicesState: (questionId, state) => {
        const question = questionOf(state, questionId);
        if (!question || question.kind === "text") return undefined;
        let build = choiceStates.get(questionId);
        if (!build) {
          build = memo(choicesOf);
          choiceStates.set(questionId, build);
        }
        return build(control(question), question.options ?? noOptions, isLocked(state));
      },
      textState: (questionId, state) => {
        const question = questionOf(state, questionId);
        const current = question && control(question);
        if (current?.kind !== "text") return undefined;
        let build = textStates.get(questionId);
        if (!build) {
          build = memo(textOf);
          textStates.set(questionId, build);
        }
        return build(current, question?.placeholder, question?.prompt ?? "", isLocked(state));
      },
      summaryState: (state) => summary(state.submitted, state.questions),
      recovery: createFocusRecovery({ fallback: () => context.element("summary") }),
      bindQuestion: (el, questionId) => {
        if (known.has(questionId)) return;
        known.add(questionId);
        if (!mounting) void enter(el, "fade-up", { motion: store.get().motion });
      },
      enterSummary: (el) => {
        if (!mounting) void enter(el, "fade", { motion: store.get().motion });
      },
      bindRoot: () => {
        const frame = requestAnimationFrame(() => {
          mounting = false;
        });
        return () => cancelAnimationFrame(frame);
      },
    };
  },
  slots: (slot) => ({
    root: slot<BaseSlotProps, { questions: Question[] }>({
      role: "form",
      state: (state) => rootState(state.questions),
      attrs: (state) => ({
        "aria-label": state.label,
        "aria-busy": isLocked(state) ? "true" : undefined,
        "data-state": isAnswering(state) ? undefined : "submitted",
        "data-motion": state.motion,
        // Spec §6: an agent's submit needs a person unless the host turns it off.
        "data-agent-confirm": state.agentConfirm ? "Sends answers for you" : undefined,
      }),
      // Enter on a choice submits the form, as UI SDK's radios and checkboxes do.
      on: {
        submit: (event, { api }) => {
          event.preventDefault();
          api.press("submit", event);
        },
      },
      bind: (_el, { api }) => api.bindRoot(),
    }),
    // A group named by its prompt, which a legend names natively in React but not as a custom element on web.
    item: slot<QuestionProps, { kind: Question["kind"] }>({
      role: "group",
      props: { value: "string" },
      selects: ownQuestion,
      present: (state, { key }) => isAnswering(state) && questionOf(state, key) !== undefined,
      state: (state, { key }) => ({ kind: questionOf(state, key)?.kind ?? "text" }),
      attrs: (state, { id, key }) => ({
        "aria-labelledby": promptId(id, key),
        "data-kind": questionOf(state, key)?.kind,
        "data-missing": missingOf(state.questions, state.value).includes(key) ? "" : undefined,
      }),
      bind: (el, part) => part.api.bindQuestion(el, part.key),
    }),
    prompt: slot<QuestionPartProps, { prompt: string; required: boolean }>({
      props: fromQuestion,
      selects: ownQuestion,
      state: (state, { key }) => promptState(questionOf(state, key)),
      attrs: (_state, { id, key }) => ({ id: promptId(id, key) }),
    }),
    choices: slot<QuestionPartProps, QuestionChoicesState | Record<never, never>>({
      props: fromQuestion,
      selects: ownQuestion,
      present: (state, { key }) => questionOf(state, key)?.kind !== "text",
      state: (state, { key, api }) => api.choicesState(key, state) ?? noState,
      // UI SDK's radios and checkboxes fire a native `change` that bubbles, as native ones do.
      on: { change: (event, { key, api }) => api.readAnswer(key, event) },
      bind: (_el, { api }) => api.syncAnswers(),
    }),
    text: slot<QuestionPartProps, QuestionTextState | Record<never, never>>({
      props: fromQuestion,
      selects: ownQuestion,
      present: (state, { key }) => questionOf(state, key)?.kind === "text",
      state: (state, { key, api }) => api.textState(key, state) ?? noState,
      on: { input: (event, { key, api }) => api.readAnswer(key, event) },
      bind: (_el, { api }) => api.syncAnswers(),
    }),
    actions: slot({ present: isAnswering }),
    submit: slot<BaseSlotProps, { label: string }>({
      role: "button",
      focus: "native",
      present: (state) => state.canSubmit && isAnswering(state),
      press: ({ api }, event) => api.press("submit", event),
      state: (state) => labelState(state.submitLabel),
      attrs: (state) => ({
        type: "button",
        "aria-disabled":
          isLocked(state) || missingOf(state.questions, state.value).length > 0 ? "true" : undefined,
        "data-pending": state.pressed === "submit" ? "" : undefined,
      }),
      bind: (el, part) => part.api.recovery.bind(el, part),
    }),
    skip: slot<BaseSlotProps, { label: string }>({
      role: "button",
      focus: "native",
      present: (state) => state.canSkip && isAnswering(state),
      press: ({ api }, event) => api.press("skip", event),
      state: (state) => labelState(state.skipLabel),
      attrs: (state) => ({
        type: "button",
        "aria-disabled": isLocked(state) ? "true" : undefined,
        "data-pending": state.pressed === "skip" ? "" : undefined,
      }),
      bind: (el, part) => part.api.recovery.bind(el, part),
    }),
    // In the actions row with the error, one at a time, so neither moves anything.
    status: slot<BaseSlotProps, { label: string }>({
      present: (state) => isLocked(state) && isAnswering(state),
      state: (state) => labelState(state.pressed === "skip" ? "Skipping" : "Sending answers"),
    }),
    "status-icon": slot({
      attrs: (state) => ({
        "aria-hidden": "true",
        "data-status-mark": "",
        "data-status": "running",
        "data-motion": state.motion,
      }),
    }),
    error: slot({
      present: (state) => state.failed && !isLocked(state) && isAnswering(state),
    }),
    // Takes the form's place. A Tab stop, so focus has somewhere to go when Submit leaves.
    summary: slot<BaseSlotProps, { outcome: string; items: QuestionSummaryItem[] }>({
      focus: "tab-stop",
      present: (state) => !isAnswering(state),
      state: (state, { api }) => api.summaryState(state),
      attrs: () => ({ tabindex: "0" }),
      bind: (el, { api }) => api.enterSummary(el),
    }),
    "summary-icon": slot({
      attrs: (state) => ({
        "aria-hidden": "true",
        "data-status-mark": "",
        "data-status": hasAnswers(state.submitted) ? "complete" : "skipped",
        "data-motion": state.motion,
      }),
    }),
  }),
  // Questions are listed by prompt, so an agent can name one to `select` or `setText`, and an unknown one is refused.
  agent: {
    actions: ["select", "setText", "submit", "skip"],
    items: (api: QuestionApi) =>
      api.getQuestions().map((question) => ({ value: question.id, label: question.prompt })),
    closed: true,
  },
});
