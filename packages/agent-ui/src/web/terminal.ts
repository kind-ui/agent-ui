import {
  type AnsiLine,
  type StepOpenChangeReason,
  type TerminalApi,
  type TerminalCopyReason,
  type TerminalOptions,
  type TerminalState,
  terminalPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";
import {
  APPROVAL_KINDS,
  type ApprovalAttributes,
  approvalOptions,
  defineConfirmation,
  type KindConfirmationElement,
  type KindConfirmationEvents,
  writeApproval,
} from "./confirmation.js";

const DEFAULT_PARTS = `<kind-terminal-trigger><button><kind-terminal-icon></kind-terminal-icon><kind-terminal-title></kind-terminal-title><kind-terminal-exit></kind-terminal-exit><kind-terminal-meta></kind-terminal-meta></button></kind-terminal-trigger><kind-terminal-approval></kind-terminal-approval><kind-terminal-content><div data-terminal-screen data-kind-code><div data-terminal-header><kind-terminal-command></kind-terminal-command><kind-terminal-copy><button></button></kind-terminal-copy></div><kind-terminal-viewport><kind-terminal-output></kind-terminal-output></kind-terminal-viewport><kind-terminal-jump><button hidden>Jump to latest</button></kind-terminal-jump></div></kind-terminal-content>`;

// Parts this element wrote text into. A part someone wrote into keeps what they wrote, as React's children do. Kept
// across instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();

const fill = (part: Element | null, text: string) => {
  if (!part || !(owned.has(part) || !part.textContent)) return;
  owned.add(part);
  if (part.textContent !== text) part.textContent = text;
};

// The pieces each title was last drawn from, odd ones code.
const titles = new WeakMap<Element, readonly string[]>();

const fillTitle = (part: Element | null, spans: readonly string[]) => {
  if (!part || !(owned.has(part) || !part.textContent) || titles.get(part) === spans) return;
  owned.add(part);
  titles.set(part, spans);
  part.replaceChildren(
    ...spans.map((piece, index) => {
      if (!(index % 2)) return piece;
      const code = part.ownerDocument.createElement("code");
      code.textContent = piece;
      return code;
    }),
  );
};

// The line each element was last drawn from, so a redraw writes only lines that changed.
const drawn = new WeakMap<Element, AnsiLine>();

const drawLine = (el: Element, line: AnsiLine) => {
  if (drawn.get(el) === line) return;
  drawn.set(el, line);
  el.replaceChildren(
    ...line.spans.map((span) => {
      const run = el.ownerDocument.createElement("span");
      run.textContent = span.text;
      if (span.fg) run.style.color = span.fg;
      if (span.bg) run.style.backgroundColor = span.bg;
      for (const name of ["bold", "dim", "italic", "underline", "strike"] as const) {
        if (span[name]) run.setAttribute(`data-${name}`, "");
      }
      return run;
    }),
  );
};

// Each output's line elements by index, so drawing reads no attributes.
const lineElements = new WeakMap<Element, Map<number, Element>>();

/** Draws a `kind-terminal-line` for each line in view, reusing each index's element. */
const drawLines = (output: Element, state: TerminalState) => {
  const existing = lineElements.get(output) ?? new Map<number, Element>();
  const wanted = new Set(state.rows.map((row) => row.index));
  // Lines that left go first, so the rest are already in order.
  for (const [index, line] of existing) {
    if (wanted.has(index)) continue;
    line.remove();
    existing.delete(index);
  }
  let previous: Element | null = null;
  for (const row of state.rows) {
    let line = existing.get(row.index);
    if (!line) {
      line = output.ownerDocument.createElement("kind-terminal-line");
      line.setAttribute("index", String(row.index));
      existing.set(row.index, line);
    }
    const shown = state.lines[row.index];
    if (shown) drawLine(line, shown);
    const before: Element | null = previous ? previous.nextElementSibling : output.firstElementChild;
    if (line !== before) output.insertBefore(line, before);
    previous = line;
  }
  lineElements.set(output, existing);
};

/**
 * `<kind-terminal>` fills in its parts when it has no children, and draws the lines in view into its
 * `kind-terminal-output`. Set `output` as a property and give it the whole output on each update. Copying fires
 * `terminalcopy`, with the output without escapes as `detail.value`. While `approval` is set (a property), an empty
 * `<kind-terminal-approval>` gets a `kind-confirmation`, which offers Deny with the `can-deny` attribute, Always allow
 * with `can-always-allow` and Run with `can-approve`, which fire `deny`, `alwaysallow` and `approve` on the terminal.
 */
export function defineTerminal(): void {
  if (customElements.get("kind-terminal")) return;
  defineConfirmation();
  createParts(terminalPrimitive, {
    root: {
      tag: "kind-terminal",
      kinds: APPROVAL_KINDS,
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => approvalOptions(el as KindTerminalElement),
      state: {
        open: {
          get: (api) => api.isOpen(),
          set: (api, open) => api.setOpen(!!open),
        },
      },
      // A native `copy` event bubbles from the selection.
      events: { onCopy: "terminalcopy" },
      // `copy` is a getter, offered only with output, which a copied list of methods would freeze.
      api: ["isOpen", "setOpen", "expand", "collapse", "toggle", "scrollToEnd"],
      render: (el, instance) => {
        if (!el.firstElementChild) el.innerHTML = DEFAULT_PARTS;
        const api = instance.api as TerminalApi;
        const draw = () => {
          const state = instance.get() as TerminalState;
          fillTitle(el.querySelector("kind-terminal-title"), api.titleSpans(state));
          if (state.exitCode) fill(el.querySelector("kind-terminal-exit"), `Exit ${state.exitCode}`);
          fill(el.querySelector("kind-terminal-meta"), state.meta);
          // Filled only once there's an approval, so a terminal without one holds no Confirmation.
          const part = state.approval && el.querySelector("kind-terminal-approval");
          if (part) {
            if (!part.firstElementChild) part.innerHTML = "<kind-confirmation></kind-confirmation>";
            const confirmation = part.querySelector<KindConfirmationElement>(":scope > kind-confirmation");
            if (confirmation) writeApproval(confirmation, api.approvalState(state));
          }
          fill(el.querySelector("kind-terminal-command"), state.command);
          const output = el.querySelector("kind-terminal-output");
          if (output) drawLines(output, state);
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    trigger: { tag: "kind-terminal-trigger", target: wrappedButton, display: "contents" },
    icon: "kind-terminal-icon",
    title: "kind-terminal-title",
    exit: "kind-terminal-exit",
    meta: "kind-terminal-meta",
    approval: "kind-terminal-approval",
    content: "kind-terminal-content",
    command: "kind-terminal-command",
    copy: { tag: "kind-terminal-copy", target: wrappedButton, display: "contents" },
    viewport: "kind-terminal-viewport",
    output: "kind-terminal-output",
    line: "kind-terminal-line",
    jump: { tag: "kind-terminal-jump", target: wrappedButton, display: "contents" },
  });
}

export type KindTerminalEvents = {
  openchange: UiChangeEvent<boolean, StepOpenChangeReason>;
  terminalcopy: UiChangeEvent<string, TerminalCopyReason>;
  approve: KindConfirmationEvents["approve"];
  deny: KindConfirmationEvents["deny"];
  alwaysallow: KindConfirmationEvents["alwaysallow"];
};

export interface KindTerminalElement
  extends UiElement<KindTerminalEvents>,
    ApprovalAttributes,
    AttributeProperties<typeof terminalPrimitive, "api" | "open" | "approval"> {
  open: boolean;
  approval?: TerminalOptions["approval"];
  api: Pick<TerminalApi, "isOpen" | "setOpen" | "expand" | "collapse" | "toggle" | "scrollToEnd">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-terminal": KindTerminalElement;
    "kind-terminal-trigger": HTMLElement;
    "kind-terminal-icon": HTMLElement;
    "kind-terminal-title": HTMLElement;
    "kind-terminal-exit": HTMLElement;
    "kind-terminal-meta": HTMLElement;
    "kind-terminal-approval": HTMLElement;
    "kind-terminal-content": HTMLElement;
    "kind-terminal-command": HTMLElement;
    "kind-terminal-copy": HTMLElement;
    "kind-terminal-viewport": HTMLElement;
    "kind-terminal-output": HTMLElement;
    "kind-terminal-line": HTMLElement;
    "kind-terminal-jump": HTMLElement;
  }
}
