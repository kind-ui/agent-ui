import {
  codeSpans,
  type DiffActionDetails,
  type DiffApi,
  type DiffLineView,
  type DiffOpenReason,
  type DiffOptions,
  type DiffState,
  type DiffTarget,
  diffPrimitive,
  WORDS,
} from "@kind-ui/agent-ui/core";
import { createParts, type UiActionDetail, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";

const PENDING = `<span data-kind-pending-mark data-status-mark data-status="running" aria-hidden="true"></span>`;

const DEFAULT_PARTS = `<kind-diff-summary><div data-diff-heading><kind-diff-summary-title></kind-diff-summary-title><kind-diff-summary-counts></kind-diff-summary-counts><kind-diff-summary-progress></kind-diff-summary-progress><kind-diff-summary-outcome></kind-diff-summary-outcome></div><kind-diff-summary-mark></kind-diff-summary-mark><kind-diff-summary-actions><kind-diff-undo-all-question></kind-diff-undo-all-question><kind-diff-undo-all><button></button></kind-diff-undo-all><kind-diff-keep-all><button>${PENDING}</button></kind-diff-keep-all><kind-diff-undo-all-cancel><button></button></kind-diff-undo-all-cancel><kind-diff-undo-all-confirm><button>${PENDING}</button></kind-diff-undo-all-confirm></kind-diff-summary-actions><kind-diff-summary-error></kind-diff-summary-error></kind-diff-summary><kind-diff-list></kind-diff-list>`;

const FILE_PARTS = `<kind-diff-file-trigger><button><span data-diff-name><kind-diff-file-path></kind-diff-file-path><kind-diff-file-old-path></kind-diff-file-old-path></span><kind-diff-file-status></kind-diff-file-status><kind-diff-file-counts></kind-diff-file-counts><kind-diff-file-mark></kind-diff-file-mark></button></kind-diff-file-trigger><kind-diff-file-actions><kind-diff-file-error></kind-diff-file-error><kind-diff-file-undo><button></button></kind-diff-file-undo><kind-diff-file-keep><button></button></kind-diff-file-keep><kind-diff-file-outcome></kind-diff-file-outcome></kind-diff-file-actions><kind-diff-file-content><kind-diff-file-note></kind-diff-file-note><kind-diff-viewport><kind-diff-table></kind-diff-table><kind-diff-show-all><button></button></kind-diff-show-all></kind-diff-viewport></kind-diff-file-content>`;

const LINE_CELLS = `<kind-diff-old-number></kind-diff-old-number><kind-diff-new-number></kind-diff-new-number><kind-diff-sign></kind-diff-sign><kind-diff-code></kind-diff-code>`;

const CHANGE_PARTS = `<kind-diff-change-title><span data-diff-change-text></span><kind-diff-change-error></kind-diff-change-error><kind-diff-change-undo><button></button></kind-diff-change-undo><kind-diff-change-keep><button></button></kind-diff-change-keep><kind-diff-change-outcome></kind-diff-change-outcome></kind-diff-change-title>`;

// Parts this element filled in. A part someone wrote into keeps what they wrote, as React's children do. Kept
// across instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();
const drawn = new WeakMap<Element, unknown>();

// Parts drawn from a template are this element's to fill in.
const fillWith = (el: Element, html: string) => {
  el.innerHTML = html;
  for (const part of el.querySelectorAll("*")) owned.add(part);
};

const ownable = (part: Element | null | undefined): part is Element =>
  !!part && (owned.has(part) || (!part.firstElementChild && !part.textContent?.trim()));

/** Draws `value` into an empty or owned part, once per value. */
const draw = <Value>(
  part: Element | null | undefined,
  value: Value,
  paint: (part: Element, value: Value) => void,
) => {
  if (!ownable(part)) return;
  owned.add(part);
  if (drawn.get(part) === value) return;
  drawn.set(part, value);
  paint(part, value);
};

const element = (part: Element, tag: string, attrs: Record<string, string> = {}, text = "") => {
  const el = part.ownerDocument.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
  el.textContent = text;
  return el;
};

const text = (part: Element, value: string) => {
  part.replaceChildren(
    ...codeSpans(value).map((piece, index) => (index % 2 ? element(part, "code", {}, piece) : piece)),
  );
};

// A button part's text goes into its button, after any running mark.
const label = (part: Element, value: string) => {
  const button = part.querySelector("button");
  if (!button) return;
  const mark = button.querySelector("[data-kind-pending-mark]");
  button.replaceChildren(...(mark ? [mark] : []), value);
};

const counts = (
  part: Element,
  { added, removed, name }: { added: string; removed: string; name: string },
) => {
  const shown = element(part, "span", { "aria-hidden": "true" });
  if (added) shown.append(element(part, "span", { "data-diff-added": "" }, added));
  if (added && removed) shown.append(" ");
  if (removed) shown.append(element(part, "span", { "data-diff-removed": "" }, removed));
  part.replaceChildren(shown, element(part, "span", { "data-diff-hidden": "" }, name));
};

const outcome = (part: Element, { text: words, working }: { text: string; working: boolean }) => {
  const mark = element(part, "span", {
    "data-status-mark": "",
    "data-status": "running",
    "aria-hidden": "true",
  });
  part.replaceChildren(...(working ? [mark] : []), words);
};

const code = (part: Element, line: DiffLineView) => {
  if (line.kind === "collapsed") {
    const button = element(part, "kind-diff-collapsed");
    button.append(element(part, "button", {}, line.show));
    part.replaceChildren(button, element(part, "kind-diff-collapsed-text", {}, line.hiddenText));
    return;
  }
  const pieces = line.pieces.map((piece) => {
    const run = element(part, "span", {}, piece.text);
    if (piece.color) run.style.color = piece.color;
    if (piece.changed) run.setAttribute("data-diff-changed", "");
    if (piece.fontStyle) run.setAttribute(`data-${piece.fontStyle}`, "");
    return run;
  });
  const wrap = line.kind === "add" ? "ins" : line.kind === "remove" ? "del" : undefined;
  const body = wrap ? element(part, wrap) : undefined;
  body?.append(...pieces);
  part.replaceChildren(
    ...(line.prefix ? [element(part, "span", { "data-diff-hidden": "" }, `${line.prefix} `)] : []),
    ...(body ? [body] : pieces),
  );
};

// Children this element added to a list or table, by key, so it moves and removes only its own.
const rowsOf = new WeakMap<Element, Map<string, Element>>();

const place = (
  parent: Element,
  keys: readonly string[],
  make: (key: string) => Element,
  before: Node | null = null,
) => {
  const existing = rowsOf.get(parent) ?? new Map<string, Element>();
  rowsOf.set(parent, existing);
  const wanted = new Set(keys);
  for (const [key, row] of existing) {
    if (wanted.has(key)) continue;
    row.remove();
    existing.delete(key);
  }
  let next: Node | null = before;
  for (let i = keys.length - 1; i >= 0; i--) {
    const key = keys[i] as string;
    let row = existing.get(key);
    if (!row) {
      row = make(key);
      existing.set(key, row);
    }
    if (row.nextSibling !== next || row.parentNode !== parent) parent.insertBefore(row, next);
    next = row;
  }
};

const drawLine = (row: Element, line: DiffLineView | undefined) => {
  if (!line) return;
  draw(row.querySelector(":scope > kind-diff-code"), line, code);
};

const drawFile = (file: Element, path: string, state: DiffState) => {
  const view = state.files[path];
  if (!view) return;
  const own = (tag: string) => file.querySelector(tag);
  draw(own("kind-diff-file-path"), view.path, (part, value) =>
    part.replaceChildren(element(part, "bdi", {}, value)),
  );
  draw(own("kind-diff-file-old-path"), view.oldPath ?? "", (part, value) =>
    part.replaceChildren(element(part, "bdi", {}, value && `from ${value}`)),
  );
  draw(own("kind-diff-file-status"), view.statusText, text);
  draw(own("kind-diff-file-counts"), `${view.added} ${view.removed} ${view.countsName}`, (part) =>
    counts(part, {
      added: view.added > 0 ? `+${view.added.toLocaleString("en-US")}` : "",
      removed: view.removed > 0 ? `\u2212${view.removed.toLocaleString("en-US")}` : "",
      name: view.countsName,
    }),
  );
  draw(own("kind-diff-file-undo"), state.undoLabel, label);
  draw(own("kind-diff-file-keep"), state.keepLabel, label);
  draw(own("kind-diff-file-error"), view.error, text);
  draw(own("kind-diff-file-outcome"), view.outcome, (part, value) =>
    outcome(part, { text: value, working: view.working !== undefined }),
  );
  draw(own("kind-diff-file-note"), view.note, text);
  draw(own("kind-diff-show-all"), view.hidden, (part) =>
    label(
      part,
      `Show full diff (${((state.tables[path]?.length ?? 0) + view.hidden).toLocaleString("en-US")} lines)`,
    ),
  );
  const table = own("kind-diff-table");
  if (!table || (!owned.has(table) && table.firstElementChild)) return;
  owned.add(table);
  let head = table.querySelector(":scope > kind-diff-head");
  if (!head) {
    head = element(table, "kind-diff-head");
    for (const column of ["old", "new", "sign", "code"]) {
      head.append(element(table, "kind-diff-column", { value: `${path}#${column}` }, COLUMNS[column]));
    }
    table.prepend(head);
  }
  const rows = state.tables[path] ?? [];
  place(
    table,
    rows.map((row) => row.key),
    (key) => {
      const isChange = rows.find((row) => row.key === key)?.change;
      const row = element(table, isChange ? "kind-diff-change" : "kind-diff-line", { value: key });
      fillWith(row, isChange ? CHANGE_PARTS : LINE_CELLS);
      return row;
    },
  );
  for (const row of rows) {
    const el = rowsOf.get(table)?.get(row.key);
    if (!el) continue;
    if (!row.change) {
      drawLine(el, state.lines[row.key]);
      continue;
    }
    const change = state.changes[row.key];
    if (!change) continue;
    const words = el.querySelector("[data-diff-change-text]");
    if (words && words.textContent !== change.title) words.textContent = change.title;
    draw(el.querySelector("kind-diff-change-undo"), state.undoLabel, label);
    draw(el.querySelector("kind-diff-change-keep"), state.keepLabel, label);
    draw(el.querySelector("kind-diff-change-error"), change.error, text);
    draw(el.querySelector("kind-diff-change-outcome"), change.outcome, (part, value) =>
      outcome(part, { text: value, working: change.working !== undefined }),
    );
  }
};

const COLUMNS: Record<string, string> = { old: "Old line", new: "New line", sign: "Change", code: "Code" };

/**
 * `<kind-diff>` fills in its parts when it has no children: the summary, then a `kind-diff-file` for each file with
 * its lines. `files` is a property. The `can-keep` and `can-undo` attributes offer Keep and Undo, which fire `keep`
 * and `undo` with the target as `detail.value`; listeners call `event.detail.waitUntil(promise)` to show "Keeping…"
 * until it settles.
 */
export function defineDiff(): void {
  if (customElements.get("kind-diff")) return;
  createParts(diffPrimitive, {
    root: {
      tag: "kind-diff",
      kinds: { canKeep: "boolean", canUndo: "boolean" },
      defaults: { perChange: true, agentConfirm: true },
      // Without an attribute its callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => {
        const { canKeep, canUndo } = el as KindDiffElement;
        return { ...(canKeep ? {} : { onKeep: undefined }), ...(canUndo ? {} : { onUndo: undefined }) };
      },
      // The actions are getters, offered only while available, which a copied list of methods would freeze.
      api: ["setOpen", "expand", "showAll"],
      render: (el, instance) => {
        if (!el.firstElementChild) fillWith(el, DEFAULT_PARTS);
        const paint = () => {
          const state = instance.get() as DiffState;
          const own = (tag: string) => el.querySelector(tag);
          draw(own("kind-diff-summary-title"), state.summary.title, text);
          draw(own("kind-diff-summary-counts"), `${state.summary.added} ${state.summary.removed}`, (part) =>
            counts(part, {
              added: state.summary.added > 0 ? `+${state.summary.added.toLocaleString("en-US")}` : "",
              removed:
                state.summary.removed > 0 ? `\u2212${state.summary.removed.toLocaleString("en-US")}` : "",
              name: state.summary.countsName,
            }),
          );
          draw(own("kind-diff-summary-progress"), state.summary.progress, text);
          draw(own("kind-diff-summary-outcome"), state.summary.progress, text);
          draw(own("kind-diff-undo-all-question"), state.summary.question, (part, value) =>
            part.replaceChildren(
              `${value} `,
              element(part, "span", { "data-diff-warning": "" }, WORDS.cantBeUndone),
            ),
          );
          draw(own("kind-diff-undo-all"), WORDS.undoAll, label);
          draw(own("kind-diff-keep-all"), WORDS.keepAll, label);
          draw(own("kind-diff-undo-all-cancel"), "Cancel", label);
          draw(own("kind-diff-undo-all-confirm"), WORDS.undoAll, label);
          draw(own("kind-diff-summary-error"), state.allError, text);
          const list = own("kind-diff-list");
          if (list && (owned.has(list) || !list.firstElementChild)) {
            owned.add(list);
            place(list, state.paths, (path) => {
              const file = element(list, "kind-diff-file", { value: path });
              fillWith(file, FILE_PARTS);
              return file;
            });
          }
          for (const file of el.querySelectorAll("kind-diff-file")) {
            const path = file.getAttribute("value");
            if (path !== null && file.closest("kind-diff") === el) drawFile(file, path, state);
          }
        };
        paint();
        return instance.subscribe(paint);
      },
    },
    summary: "kind-diff-summary",
    "summary-title": "kind-diff-summary-title",
    "summary-counts": "kind-diff-summary-counts",
    "summary-mark": "kind-diff-summary-mark",
    "summary-progress": "kind-diff-summary-progress",
    "summary-outcome": "kind-diff-summary-outcome",
    "summary-actions": "kind-diff-summary-actions",
    "undo-all": { tag: "kind-diff-undo-all", target: wrappedButton, display: "contents" },
    "keep-all": { tag: "kind-diff-keep-all", target: wrappedButton, display: "contents" },
    "undo-all-question": "kind-diff-undo-all-question",
    "undo-all-cancel": { tag: "kind-diff-undo-all-cancel", target: wrappedButton, display: "contents" },
    "undo-all-confirm": { tag: "kind-diff-undo-all-confirm", target: wrappedButton, display: "contents" },
    "summary-error": "kind-diff-summary-error",
    list: "kind-diff-list",
    file: "kind-diff-file",
    "file-trigger": { tag: "kind-diff-file-trigger", target: wrappedButton, display: "contents" },
    "file-path": "kind-diff-file-path",
    "file-old-path": "kind-diff-file-old-path",
    "file-status": "kind-diff-file-status",
    "file-counts": "kind-diff-file-counts",
    "file-mark": "kind-diff-file-mark",
    "file-actions": "kind-diff-file-actions",
    "file-undo": { tag: "kind-diff-file-undo", target: wrappedButton, display: "contents" },
    "file-keep": { tag: "kind-diff-file-keep", target: wrappedButton, display: "contents" },
    "file-outcome": "kind-diff-file-outcome",
    "file-error": "kind-diff-file-error",
    "file-content": "kind-diff-file-content",
    "file-note": "kind-diff-file-note",
    viewport: "kind-diff-viewport",
    table: "kind-diff-table",
    head: "kind-diff-head",
    column: "kind-diff-column",
    change: "kind-diff-change",
    "change-title": "kind-diff-change-title",
    "change-undo": { tag: "kind-diff-change-undo", target: wrappedButton, display: "contents" },
    "change-keep": { tag: "kind-diff-change-keep", target: wrappedButton, display: "contents" },
    "change-outcome": "kind-diff-change-outcome",
    "change-error": "kind-diff-change-error",
    line: "kind-diff-line",
    "old-number": "kind-diff-old-number",
    "new-number": "kind-diff-new-number",
    sign: "kind-diff-sign",
    code: "kind-diff-code",
    collapsed: { tag: "kind-diff-collapsed", target: wrappedButton, display: "contents" },
    "collapsed-text": "kind-diff-collapsed-text",
    "show-all": { tag: "kind-diff-show-all", target: wrappedButton, display: "contents" },
  });
}

export type KindDiffEvents = {
  keep: CustomEvent<{ value: DiffTarget } & DiffActionDetails & Pick<UiActionDetail, "waitUntil">>;
  undo: CustomEvent<{ value: DiffTarget } & DiffActionDetails & Pick<UiActionDetail, "waitUntil">>;
  openchange: UiChangeEvent<string[], DiffOpenReason>;
};

export interface KindDiffElement
  extends UiElement<KindDiffEvents>,
    AttributeProperties<typeof diffPrimitive, "api"> {
  canKeep: boolean;
  canUndo: boolean;
  files?: DiffOptions["files"];
  api: Pick<DiffApi, "setOpen" | "expand" | "showAll">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-diff": KindDiffElement;
  }
}
