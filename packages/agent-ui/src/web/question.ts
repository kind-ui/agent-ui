import {
  type QuestionApi,
  type QuestionOptions,
  type QuestionState,
  type QuestionValueChangeReason,
  questionPrimitive,
} from "@kind-ui/agent-ui/core";
import type { ActionDetails } from "@ui-sdk/core";
import { createParts, type UiActionDetail, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement, UiPartElement } from "@ui-sdk/web/events";
import { defineInternalCheckbox } from "./internal/checkbox.js";
import { defineInternalRadio } from "./internal/radio.js";
import { defineInternalTextarea } from "./internal/textarea.js";

type Question = NonNullable<QuestionOptions["questions"]>[number];

const DEFAULT_PARTS = `<kind-question-actions><kind-question-submit><button></button></kind-question-submit><kind-question-skip><button></button></kind-question-skip><kind-question-status><kind-question-status-icon></kind-question-status-icon><span data-question-label></span></kind-question-status><kind-question-error>Answers not sent. Try again.</kind-question-error></kind-question-actions><kind-question-summary><span data-question-outcome><kind-question-summary-icon></kind-question-summary-icon><span data-question-label></span></span><dl></dl></kind-question-summary>`;
const CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`;

// Parts this element wrote text into, and questions it added. A part someone wrote text into keeps it, and a question
// someone wrote stays, as React's children do. Kept across instances, because UI SDK rebuilds one when the element
// returns to the page.
const owned = new WeakSet<Element>();
// Radio groups the element named, so a page's own name stays.
const named = new WeakSet<Element>();
// The question each item this element fills was drawn from, so a changed question is drawn again.
const drawn = new WeakMap<Element, Question>();

const fill = (part: Element | null | undefined, text: string) => {
  if (!part || !(owned.has(part) || !part.textContent)) return;
  owned.add(part);
  if (part.textContent !== text) part.textContent = text;
};

const write = <Target extends object, Key extends keyof Target>(
  target: Target | null,
  key: Key,
  value: Target[Key],
) => {
  if (target && target[key] !== value) target[key] = value;
};

const element = (document: Document, tag: string, attributes: Record<string, string> = {}, text?: string) => {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value);
  if (text !== undefined) el.textContent = text;
  return el;
};

/** A question's prompt and its choices or text box, built from its data so no option text is parsed as markup. */
const questionParts = (document: Document, question: Question): Element[] => {
  const prompt = element(document, "kind-question-prompt");
  if (question.kind === "text") {
    const textarea = element(document, "textarea", { rows: "3" });
    const box = element(document, "ui-textarea");
    box.append(textarea);
    const wrapper = element(document, "kind-internal-textarea");
    wrapper.append(box);
    const text = element(document, "kind-question-text");
    text.append(wrapper);
    return [prompt, text];
  }
  const single = question.kind === "single";
  const group = element(document, single ? "ui-radio-group" : "ui-checkbox-group");
  for (const option of question.options ?? []) {
    const control = element(document, single ? "ui-radio" : "ui-checkbox", { value: option.value });
    const indicator = element(document, single ? "ui-radio-indicator" : "ui-checkbox-indicator");
    if (!single) indicator.innerHTML = CHECK;
    control.append(indicator);
    const text = element(document, "span", { "data-question-option-text": "" });
    text.append(element(document, "span", {}, option.label));
    if (option.description)
      text.append(element(document, "span", { "data-question-option-description": "" }, option.description));
    const label = element(document, "label", { "data-question-option": "" });
    label.append(control, text);
    group.append(label);
  }
  const wrapper = element(document, single ? "kind-internal-radio" : "kind-internal-checkbox");
  wrapper.append(group);
  const choices = element(document, "kind-question-choices");
  choices.append(wrapper);
  return [prompt, choices];
};

type Movable = Element & { moveBefore?: (node: Node, child: Node | null) => void };

// `moveBefore` keeps a focused question focused where the browser has it; `insertBefore` blurs it.
function move(form: Movable, item: Element, before: Element | null): void {
  if (form.moveBefore && item.isConnected) form.moveBefore(item, before);
  else form.insertBefore(item, before);
}

const sameOptions = (a: Question["options"] = [], b: Question["options"] = []) =>
  a.length === b.length &&
  a.every(
    (option, index) =>
      option.value === b[index]?.value &&
      option.label === b[index]?.label &&
      option.description === b[index]?.description,
  );

/**
 * Adds a question for each one the form lacks, in order before the actions, and removes the ones it added for
 * questions that left or that a written item replaced. Fills the items it added, and written ones left empty, again
 * when a question's kind or options change, so a new array with the same content keeps focus.
 */
const drawQuestions = (form: Movable, questions: Question[]) => {
  const items = new Map<string | null, Element>();
  for (const child of form.querySelectorAll(":scope > kind-question-item")) {
    const value = child.getAttribute("value");
    const earlier = items.get(value);
    if (!earlier) items.set(value, child);
    else if (owned.has(child)) child.remove();
    else if (owned.has(earlier)) {
      earlier.remove();
      items.set(value, child);
    }
  }
  const ids = new Set<string | null>(questions.map((question) => question.id));
  for (const [id, child] of items) if (owned.has(child) && !ids.has(id)) child.remove();
  let previous: Element | null = null;
  for (const question of questions) {
    let child = items.get(question.id);
    if (!child) {
      child = form.ownerDocument.createElement("kind-question-item");
      child.setAttribute("value", question.id);
      owned.add(child);
    }
    if (drawn.has(child) || owned.has(child) || !child.firstChild) {
      const before = drawn.get(child);
      if (before?.kind !== question.kind || !sameOptions(before.options, question.options))
        child.replaceChildren(...questionParts(form.ownerDocument, question));
      drawn.set(child, question);
    }
    const after: Element | null = previous
      ? previous.nextElementSibling
      : (form.querySelector(":scope > kind-question-item") ??
        form.querySelector(":scope > kind-question-actions"));
    if (owned.has(child) && after !== child) move(form, child, after);
    previous = child;
  }
};

const drawSummary = (list: Element | null, items: ReturnType<QuestionApi["summaryState"]>["items"]) => {
  if (!list || !(owned.has(list) || !list.firstChild)) return;
  owned.add(list);
  const document = list.ownerDocument;
  list.replaceChildren(
    ...items.map((item) => {
      const row = element(document, "div");
      row.append(
        element(document, "dt", {}, item.prompt),
        element(
          document,
          "dd",
          item.answer === undefined ? { "data-empty": "" } : {},
          item.answer ?? "No answer",
        ),
      );
      return row;
    }),
  );
};

// A `form` the element holds, else one it adds, so Enter on a choice submits as it does in React.
const ownForm = (el: HTMLElement): HTMLFormElement =>
  el.querySelector<HTMLFormElement>(":scope > form") ??
  el.appendChild(el.ownerDocument.createElement("form"));

/**
 * `<kind-question label="Deploy questions">` fills in its form when it has no children. Set `questions`, `value` and
 * `submitted` as properties. The `can-submit` and `can-skip` attributes show Submit and Skip, which fire
 * `questionsubmit` and `skip` with the answers as `detail.value`: call `event.detail.waitUntil(promise)` to keep the
 * form locked until it settles. Write a `<kind-question-item value="…">` inside a `<form>` child to render a question
 * yourself; one written empty gets the question's prompt and its choices or text box.
 */
export function defineQuestion(): void {
  if (customElements.get("kind-question")) return;
  defineInternalRadio();
  defineInternalCheckbox();
  defineInternalTextarea();
  createParts(questionPrimitive, {
    root: {
      tag: "kind-question",
      target: ownForm,
      display: "contents",
      kinds: { canSubmit: "boolean", canSkip: "boolean" },
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => {
        const { canSubmit, canSkip } = el as KindQuestionElement;
        return { ...(!canSubmit && { onSubmit: undefined }), ...(!canSkip && { onSkip: undefined }) };
      },
      events: { onSubmit: "questionsubmit" },
      defaults: { agentConfirm: true },
      state: {
        value: {
          get: (api) => api.getValue(),
          set: (api, value) => api.setValue(value ?? {}),
        },
      },
      api: ["getValue", "setValue", "select", "setText"],
      render: (el, instance) => {
        const form = ownForm(el);
        if (!form.querySelector(":scope > kind-question-actions"))
          form.insertAdjacentHTML("beforeend", DEFAULT_PARTS);
        const api = instance.api as QuestionApi;
        const draw = () => {
          const state = instance.get() as QuestionState;
          drawQuestions(form, state.questions);
          for (const item of form.querySelectorAll(":scope > kind-question-item")) {
            const id = item.getAttribute("value") ?? "";
            const question = state.questions.find((each) => each.id === id);
            if (!question) continue;
            const prompt = item.querySelector("kind-question-prompt");
            if (prompt && (owned.has(prompt) || !prompt.firstChild)) {
              owned.add(prompt);
              const required = prompt.querySelector("[data-question-required]");
              if (prompt.firstChild?.textContent !== question.prompt || !!required !== !!question.required) {
                prompt.replaceChildren(question.prompt);
                if (question.required)
                  prompt.append(
                    " ",
                    element(el.ownerDocument, "span", { "data-question-required": "" }, "Required"),
                  );
              }
            }
            const choices = api.choicesState(id, state);
            if (choices) {
              const group = item.querySelector<Element & { controller?: unknown; readOnly?: boolean }>(
                "kind-question-choices :is(ui-radio-group, ui-checkbox-group)",
              );
              write(group, "controller", choices.controller);
              write(group, "readOnly", choices.readOnly);
              // Named by its prompt's text (a render file can't write `aria-labelledby`), unless the page named a
              // group it wrote.
              if (
                group &&
                prompt &&
                choices.kind === "single" &&
                (named.has(group) ||
                  (!group.hasAttribute("aria-label") && !group.hasAttribute("aria-labelledby")))
              ) {
                named.add(group);
                write(group, "ariaLabel", prompt.textContent?.trim() ?? "");
              }
            }
            const text = api.textState(id, state);
            if (text) {
              write(
                item.querySelector<Element & { controller?: unknown }>("kind-question-text ui-textarea"),
                "controller",
                text.controller,
              );
              const textarea = item.querySelector<HTMLTextAreaElement>("kind-question-text textarea");
              write(textarea, "readOnly", text.readOnly);
              write(textarea, "placeholder", text.placeholder ?? "");
              write(textarea, "ariaLabel", text.label);
            }
          }
          api.syncAnswers();
          fill(form.querySelector("kind-question-submit button"), state.submitLabel);
          fill(form.querySelector("kind-question-skip button"), state.skipLabel);
          fill(
            form.querySelector("kind-question-status [data-question-label]"),
            state.pressed === "skip" ? "Skipping" : "Sending answers",
          );
          const summary = api.summaryState(state);
          fill(
            form.querySelector("kind-question-summary [data-question-outcome] [data-question-label]"),
            summary.outcome,
          );
          drawSummary(form.querySelector("kind-question-summary dl"), summary.items);
        };
        draw();
        const unsubscribe = instance.subscribe(draw);
        // Parts and questions written or removed after the element connects redraw it.
        const arrivals = new MutationObserver((records) => {
          const changed = records.some((record) =>
            [...record.addedNodes, ...record.removedNodes].some(
              (node) => node instanceof Element && !node.closest("kind-question-summary dl"),
            ),
          );
          if (changed) draw();
        });
        arrivals.observe(form, { childList: true, subtree: true });
        return () => {
          unsubscribe();
          arrivals.disconnect();
        };
      },
    },
    item: "kind-question-item",
    prompt: "kind-question-prompt",
    choices: "kind-question-choices",
    text: "kind-question-text",
    actions: "kind-question-actions",
    submit: { tag: "kind-question-submit", target: wrappedButton, display: "contents" },
    skip: { tag: "kind-question-skip", target: wrappedButton, display: "contents" },
    status: "kind-question-status",
    "status-icon": "kind-question-status-icon",
    error: "kind-question-error",
    summary: "kind-question-summary",
    "summary-icon": "kind-question-summary-icon",
  });
}

type AnswersEvent = CustomEvent<
  { value: NonNullable<QuestionOptions["value"]> } & ActionDetails & Pick<UiActionDetail, "waitUntil">
>;

export type KindQuestionEvents = {
  questionsubmit: AnswersEvent;
  skip: AnswersEvent;
  valuechange: UiChangeEvent<NonNullable<QuestionOptions["value"]>, QuestionValueChangeReason>;
};

export interface KindQuestionElement
  extends UiElement<KindQuestionEvents>,
    AttributeProperties<
      typeof questionPrimitive,
      "api" | "questions" | "value" | "defaultValue" | "submitted"
    > {
  canSubmit: boolean;
  canSkip: boolean;
  questions?: QuestionOptions["questions"];
  value: NonNullable<QuestionOptions["value"]>;
  defaultValue?: QuestionOptions["defaultValue"];
  submitted?: QuestionOptions["submitted"];
  api: Pick<QuestionApi, "getValue" | "setValue" | "select" | "setText">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-question": KindQuestionElement;
    "kind-question-item": UiPartElement<typeof questionPrimitive, "item", "value">;
    "kind-question-prompt": HTMLElement;
    "kind-question-choices": HTMLElement;
    "kind-question-text": HTMLElement;
    "kind-question-actions": HTMLElement;
    "kind-question-submit": HTMLElement;
    "kind-question-skip": HTMLElement;
    "kind-question-status": HTMLElement;
    "kind-question-status-icon": HTMLElement;
    "kind-question-error": HTMLElement;
    "kind-question-summary": HTMLElement;
    "kind-question-summary-icon": HTMLElement;
  }
}
