import {
  type DiffActionDetails,
  type DiffApi,
  type DiffCopyReason,
  type DiffRow,
  type DiffState,
  diffPieces,
  diffPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, type UiActionDetail, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";

const DEFAULT_PARTS = `<kind-diff-header><kind-diff-path></kind-diff-path><kind-diff-status></kind-diff-status><kind-diff-stats></kind-diff-stats><kind-diff-copy><button></button></kind-diff-copy><kind-diff-revert><button>Revert</button></kind-diff-revert><kind-diff-accept><button>Accept</button></kind-diff-accept></kind-diff-header><kind-diff-viewport><kind-diff-table></kind-diff-table></kind-diff-viewport>`;

// Parts this element wrote text into. A part someone wrote into keeps what they wrote, as React's children do. Kept
// across instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();

const fill = (part: Element | null, text: string) => {
  if (!part || !(owned.has(part) || !part.textContent)) return;
  owned.add(part);
  if (part.textContent !== text) part.textContent = text;
};

const drawPath = (part: Element | null, { path, oldPath }: DiffState) => {
  if (!part || !(owned.has(part) || !part.textContent)) return;
  owned.add(part);
  const renamed = oldPath !== undefined && oldPath !== path;
  if (part.textContent === (renamed ? `${oldPath}${path}` : path)) return;
  if (!renamed) {
    part.textContent = path;
    return;
  }
  const old = part.ownerDocument.createElement("span");
  old.setAttribute("data-diff-old-path", "");
  old.textContent = oldPath;
  part.replaceChildren(old, path);
};

const CELLS = `<kind-diff-old-number></kind-diff-old-number><kind-diff-new-number></kind-diff-new-number><kind-diff-sign></kind-diff-sign><kind-diff-code></kind-diff-code>`;

// What each row element was last drawn from, so a redraw writes only rows that changed.
const drawn = new WeakMap<Element, { row: DiffRow; oldTokens: object; newTokens: object }>();

const drawRow = (el: Element, row: DiffRow, state: DiffState) => {
  const last = drawn.get(el);
  if (last?.row === row && last.oldTokens === state.oldTokens && last.newTokens === state.newTokens) return;
  drawn.set(el, { row, oldTokens: state.oldTokens, newTokens: state.newTokens });
  const [oldNumber, newNumber, sign, code] = el.children;
  const folded = row.kind === "collapsed";
  if (oldNumber) oldNumber.textContent = folded ? "" : String(row.oldLine ?? "");
  if (newNumber) newNumber.textContent = folded ? "" : String(row.newLine ?? "");
  if (sign) sign.textContent = row.kind === "add" ? "added" : row.kind === "remove" ? "removed" : "";
  if (!code) return;
  const document = el.ownerDocument;
  if (row.kind === "hunk") {
    code.textContent = row.text;
    return;
  }
  if (row.kind === "collapsed") {
    const lines = row.lines ?? [];
    const button = document.createElement("kind-diff-collapsed");
    const inner = document.createElement("button");
    inner.textContent = `Show ${lines.length === 1 ? "1 line" : `${lines.length} lines`}`;
    button.append(inner);
    const text = document.createElement("kind-diff-collapsed-text");
    text.textContent = lines.map((line) => line.text).join("\n");
    code.replaceChildren(button, text);
    return;
  }
  const tokens =
    row.kind === "remove" ? state.oldTokens[row.oldLine ?? 0] : state.newTokens[row.newLine ?? 0];
  code.replaceChildren(
    ...diffPieces(row.text, tokens, row.words).map((piece) => {
      const run = document.createElement(piece.changed ? "mark" : "span");
      run.textContent = piece.text;
      if (piece.color) run.style.color = piece.color;
      if (piece.fontStyle) run.setAttribute(`data-${piece.fontStyle}`, "");
      return run;
    }),
  );
};

// Each table's row elements by index, so drawing reads no attributes.
const rowElements = new WeakMap<Element, Map<number, Element>>();

/** Draws a `kind-diff-row` for each row in view, reusing each index's element. */
const drawRows = (table: Element, state: DiffState) => {
  const existing = rowElements.get(table) ?? new Map<number, Element>();
  const wanted = new Set(state.rows.map((row) => row.index));
  // Rows that left go first, so the rest are already in order.
  for (const [index, row] of existing) {
    if (wanted.has(index)) continue;
    row.remove();
    existing.delete(index);
  }
  let previous: Element | null = null;
  for (const item of state.rows) {
    let row = existing.get(item.index);
    if (!row) {
      row = table.ownerDocument.createElement("kind-diff-row");
      row.setAttribute("index", String(item.index));
      row.setAttribute("value", String(item.index));
      row.innerHTML = CELLS;
      existing.set(item.index, row);
    }
    const shown = state.display[item.index];
    if (shown) drawRow(row, shown, state);
    const before: Element | null = previous ? previous.nextElementSibling : table.firstElementChild;
    if (row !== before) table.insertBefore(row, before);
    previous = row;
  }
  rowElements.set(table, existing);
};

/**
 * `<kind-diff>` fills in its parts when it has no children, and draws the rows in view into its `kind-diff-table`.
 * Set `file`, and `patch` or `before` and `after`, as properties. The `can-accept` and `can-revert` attributes offer
 * Accept and Revert, which fire `diffaccept` and `diffrevert`; listeners call `event.detail.waitUntil(promise)` to
 * keep both locked until it settles. Copy fires `diffcopy`, with the patch as `detail.value`.
 */
export function defineDiff(): void {
  if (customElements.get("kind-diff")) return;
  createParts(diffPrimitive, {
    root: {
      tag: "kind-diff",
      kinds: { canAccept: "boolean", canRevert: "boolean" },
      // Without an attribute its callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => {
        const { canAccept, canRevert } = el as KindDiffElement;
        return {
          ...(canAccept ? {} : { onAccept: undefined }),
          ...(canRevert ? {} : { onRevert: undefined }),
        };
      },
      // A native `copy` event bubbles from the selection.
      events: { onAccept: "diffaccept", onRevert: "diffrevert", onCopy: "diffcopy" },
      // The actions are getters, offered only while available, which a copied list of methods would freeze.
      api: ["expand"],
      render: (el, instance) => {
        if (!el.firstElementChild) el.innerHTML = DEFAULT_PARTS;
        const draw = () => {
          const state = instance.get() as DiffState;
          drawPath(el.querySelector("kind-diff-path"), state);
          fill(el.querySelector("kind-diff-status"), state.statusText);
          fill(el.querySelector("kind-diff-stats"), `+${state.added} −${state.removed}`);
          const table = el.querySelector("kind-diff-table");
          if (table) drawRows(table, state);
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    header: "kind-diff-header",
    path: "kind-diff-path",
    status: "kind-diff-status",
    stats: "kind-diff-stats",
    copy: { tag: "kind-diff-copy", target: wrappedButton, display: "contents" },
    accept: { tag: "kind-diff-accept", target: wrappedButton, display: "contents" },
    revert: { tag: "kind-diff-revert", target: wrappedButton, display: "contents" },
    viewport: "kind-diff-viewport",
    table: "kind-diff-table",
    row: "kind-diff-row",
    "old-number": "kind-diff-old-number",
    "new-number": "kind-diff-new-number",
    sign: "kind-diff-sign",
    code: "kind-diff-code",
    collapsed: { tag: "kind-diff-collapsed", target: wrappedButton, display: "contents" },
    "collapsed-text": "kind-diff-collapsed-text",
  });
}

export type KindDiffEvents = {
  diffaccept: CustomEvent<DiffActionDetails & Pick<UiActionDetail, "waitUntil">>;
  diffrevert: CustomEvent<DiffActionDetails & Pick<UiActionDetail, "waitUntil">>;
  diffcopy: UiChangeEvent<string, DiffCopyReason>;
};

export interface KindDiffElement
  extends UiElement<KindDiffEvents>,
    AttributeProperties<typeof diffPrimitive, "api"> {
  canAccept: boolean;
  canRevert: boolean;
  api: Pick<DiffApi, "expand">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-diff": KindDiffElement;
    "kind-diff-header": HTMLElement;
    "kind-diff-path": HTMLElement;
    "kind-diff-status": HTMLElement;
    "kind-diff-stats": HTMLElement;
    "kind-diff-copy": HTMLElement;
    "kind-diff-accept": HTMLElement;
    "kind-diff-revert": HTMLElement;
    "kind-diff-viewport": HTMLElement;
    "kind-diff-table": HTMLElement;
    "kind-diff-row": HTMLElement;
    "kind-diff-old-number": HTMLElement;
    "kind-diff-new-number": HTMLElement;
    "kind-diff-sign": HTMLElement;
    "kind-diff-code": HTMLElement;
    "kind-diff-collapsed": HTMLElement;
    "kind-diff-collapsed-text": HTMLElement;
  }
}
