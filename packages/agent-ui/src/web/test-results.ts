import {
  emptyTestsText,
  type StepOpenChangeReason,
  type TestResultsApi,
  type TestResultsExpandedChangeReason,
  type TestResultsFilter,
  type TestResultsFilterChangeReason,
  type TestResultsOptions,
  type TestResultsRow,
  type TestResultsState,
  testResultsPrimitive,
} from "@kind-ui/agent-ui/core";
import type { TreeItemData } from "@ui-sdk/core";
import { createParts, wrappedButton } from "@ui-sdk/web";
import type {
  AttributeProperties,
  UiChangeEvent,
  UiElement,
  UiPartElement,
  UiTreeElement,
} from "@ui-sdk/web/events";
import { defineInternalTree } from "./internal/tree.js";
import { defineStackTrace } from "./stack-trace.js";

const DEFAULT_PARTS = `<kind-test-results-trigger><button><kind-test-results-icon></kind-test-results-icon><kind-test-results-title></kind-test-results-title><kind-test-results-meta></kind-test-results-meta></button></kind-test-results-trigger><kind-test-results-filter></kind-test-results-filter><kind-test-results-content><div data-test-results-panel><kind-test-results-tree></kind-test-results-tree><kind-test-results-empty></kind-test-results-empty></div></kind-test-results-content>`;

// Lucide "chevron-right", see THIRD_PARTY_NOTICES.md.
const CHEVRON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 18 6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// Parts this element wrote into. A part someone wrote into keeps what they wrote, as React's children do. Kept
// across instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();

// Whitespace a page wrote between tags doesn't count.
const isEmpty = (part: Element) => !part.firstElementChild && !part.textContent?.trim();

const ownedOrEmpty = (part: Element | null): part is Element => {
  if (!part || !(owned.has(part) || isEmpty(part))) return false;
  owned.add(part);
  return true;
};

const fill = (part: Element | null, text: string) => {
  if (ownedOrEmpty(part) && part.textContent !== text) part.textContent = text;
};

const element = (document: Document, tag: string, attributes: Record<string, string> = {}, text?: string) => {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value);
  if (text !== undefined) el.textContent = text;
  return el;
};

const WORDS = { pass: "passed", fail: "failed", skip: "skipped" } as const;

const COUNTS = `<kind-test-results-count value="pass"><button></button></kind-test-results-count><kind-test-results-count value="fail"><button></button></kind-test-results-count><kind-test-results-count value="skip"><button></button></kind-test-results-count>`;

/** Gives an empty filter its counts, and writes each count's words into its button, unless someone wrote into it. */
const fillCounts = (el: Element, { counts }: TestResultsState) => {
  const filter = el.querySelector("kind-test-results-filter");
  if (filter && isEmpty(filter)) filter.innerHTML = COUNTS;
  for (const count of el.querySelectorAll("kind-test-results-count")) {
    const status = count.getAttribute("value");
    if (status !== "pass" && status !== "fail" && status !== "skip") continue;
    fill(count.querySelector(":scope > button"), `${counts[status]} ${WORDS[status]}`);
  }
};

// The row each element was last drawn from, so a redraw writes only rows that changed.
const drawn = new WeakMap<Element, TestResultsRow>();

// Every row has an indicator, a passed or skipped test's an empty spacer that lines its name up with the others. It's
// hidden from agents, which hides UI SDK's Tree from them while the rows stay the Test Results'.
const newRow = (document: Document, value: string) => {
  const row = element(document, "ui-tree-item", { value });
  const label = element(document, "ui-tree-item-label");
  const item = element(document, "kind-test-results-item", { value });
  // A space keeps the name and the status's words apart in the row's accessible name.
  item.append(
    element(document, "span", { "data-test-results-name": "" }),
    " ",
    element(document, "kind-test-results-item-status"),
  );
  label.append(element(document, "ui-tree-item-indicator", { "data-agent-hidden": "" }), item);
  row.append(label);
  return row;
};

/** Writes a row's name, as text so no name is parsed as markup, and a failure's error into its Stack Trace. */
const drawRow = (row: Element, shown: TestResultsRow, motion: TestResultsState["motion"]) => {
  const name = row.querySelector(
    ":scope > ui-tree-item-label > kind-test-results-item > [data-test-results-name]",
  );
  if (name && name.textContent !== shown.name) name.textContent = shown.name;
  const trace = row.querySelector<HTMLElementTagNameMap["kind-stack-trace"]>(
    ":scope > ui-tree-group > kind-test-results-failure > kind-stack-trace",
  );
  if (!trace) return;
  if (drawn.get(trace) !== shown) {
    drawn.set(trace, shown);
    Object.assign(trace, { message: shown.message || undefined, stack: shown.stack });
  }
  if (trace.motion !== motion) trace.motion = motion;
};

type Movable = Element & { moveBefore?: (node: Node, child: Node | null) => void };

// `moveBefore` keeps a focused row focused where the browser has it; `insertBefore` blurs it.
const place = (parent: Movable, child: Element, before: Element | null) => {
  if (before === child || (child.parentElement === parent && child.nextElementSibling === before)) return;
  if (parent.moveBefore && child.isConnected) parent.moveBefore(child, before);
  else parent.insertBefore(child, before);
};

/** Draws the rows into a tree or a suite's group, reusing each value's element so focus and open rows stay. */
const drawRows = (parent: Element, items: TreeItemData[], state: TestResultsState) => {
  const document = parent.ownerDocument;
  const existing = new Map<string, Element>();
  const wanted = new Set(items.map((data) => data.value));
  // Rows that left go first, so the rest are already in place and keep focus where the browser has no `moveBefore`.
  for (const row of parent.querySelectorAll(":scope > ui-tree-item")) {
    const value = row.getAttribute("value") ?? "";
    if (wanted.has(value)) existing.set(value, row);
    else row.remove();
  }
  let previous: Element | null = null;
  for (const data of items) {
    const row = existing.get(data.value) ?? newRow(document, data.value);
    existing.delete(data.value);
    const indicator = row.querySelector(":scope > ui-tree-item-label > ui-tree-item-indicator");
    let group = row.querySelector(":scope > ui-tree-group");
    if (data.children) {
      if (indicator && !indicator.firstElementChild) indicator.innerHTML = CHEVRON;
      if (!group) {
        group = element(document, "ui-tree-group");
        row.append(group);
      }
      if (data.children.length > 0) drawRows(group, data.children, state);
      else if (!group.firstElementChild) {
        const failure = element(document, "kind-test-results-failure", { value: data.value });
        const trace = element(document, "kind-stack-trace", { "auto-open": "never" });
        failure.append(trace);
        group.append(failure);
      }
    } else {
      indicator?.replaceChildren();
      group?.remove();
    }
    const shown = Object.hasOwn(state.rows, data.value) ? state.rows[data.value] : undefined;
    if (shown) drawRow(row, shown, state.motion);
    place(parent, row, previous ? previous.nextElementSibling : parent.firstElementChild);
    previous = row;
  }
};

/**
 * Gives an empty tree part its Tree, which reads its defaults as it connects and draws bare rows of its own from
 * `items` when it has none, so it gets both, and our rows, before it connects.
 */
const fillTree = (part: Element | null, api: TestResultsApi, state: TestResultsState) => {
  if (!part || !isEmpty(part)) return;
  const document = part.ownerDocument;
  const tree = document.createElement("ui-tree");
  const { "aria-label": label, ...props } = api.treeState(state);
  drawRows(tree, props.items, state);
  Object.assign(tree, props);
  tree.ariaLabel = label;
  const host = element(document, "kind-internal-tree");
  host.append(tree);
  part.replaceChildren(host);
};

/**
 * `<kind-test-results>` fills in its parts when it has no children. Set `suites` as a property; its tree gets a row
 * for each suite and test, and a failed test opens to a `<kind-stack-trace>`. Pressing a count filters the tests and
 * fires `filterchange`, and opening or closing rows fires `expandchange`, each with the filter or the open rows as
 * `detail.value`.
 */
export function defineTestResults(): void {
  if (customElements.get("kind-test-results")) return;
  defineInternalTree();
  defineStackTrace();
  createParts(testResultsPrimitive, {
    root: {
      tag: "kind-test-results",
      state: {
        open: { get: (api) => api.isOpen(), set: (api, open) => api.setOpen(!!open) },
        filter: {
          get: (api) => api.getFilter(),
          set: (api, filter) => api.setFilter(filter as TestResultsFilter),
        },
        expanded: {
          get: (api) => api.getExpanded(),
          set: (api, values) => api.setExpanded(values as string[]),
        },
      },
      // The inner Tree fires `expandedchange` of its own, which a capture listener would hear first.
      events: { onFilterChange: "filterchange", onExpandedChange: "expandchange" },
      api: [
        "isOpen",
        "setOpen",
        "toggle",
        "expand",
        "collapse",
        "getSuites",
        "getFilter",
        "setFilter",
        "getExpanded",
        "setExpanded",
      ],
      render: (el, instance) => {
        if (!el.firstElementChild) el.innerHTML = DEFAULT_PARTS;
        const api = instance.api as TestResultsApi;
        let drawnTree: Element | undefined;
        let drawnItems: TreeItemData[] | undefined;
        let drawnRows: TestResultsState["rows"] | undefined;
        let drawnMotion: TestResultsState["motion"] | undefined;
        const draw = () => {
          const state = instance.get() as TestResultsState;
          fill(el.querySelector("kind-test-results-title"), state.title);
          fill(el.querySelector("kind-test-results-meta"), state.duration);
          fillCounts(el, state);
          fill(el.querySelector("kind-test-results-empty"), emptyTestsText(state.filter));
          const treePart = el.querySelector("kind-test-results-tree");
          fillTree(treePart, api, state);
          const tree = treePart?.querySelector<UiTreeElement>(":scope > kind-internal-tree > ui-tree");
          if (!tree) return;
          const { "aria-label": label, items, controller: treeController } = api.treeState(state);
          if (
            tree !== drawnTree ||
            items !== drawnItems ||
            state.rows !== drawnRows ||
            state.motion !== drawnMotion
          ) {
            drawnTree = tree;
            drawnItems = items;
            drawnRows = state.rows;
            drawnMotion = state.motion;
            drawRows(tree, items, state);
          }
          if (tree.controller !== treeController) tree.controller = treeController;
          if (tree.items !== items) tree.items = items;
          if (tree.ariaLabel !== label) tree.ariaLabel = label;
          api.syncTree();
        };
        draw();
        const unsubscribe = instance.subscribe(draw);
        // A part a page adds later is filled in when it arrives, and a count when its `value` changes. The rows and
        // stack traces drawn inside aren't parts.
        const arrivals = new MutationObserver((records) => {
          const arrived = records.some((record) =>
            record.type === "attributes"
              ? record.target instanceof Element && record.target.localName === "kind-test-results-count"
              : !(record.target instanceof Element && record.target.closest("ui-tree")) &&
                [...record.addedNodes].some((node) => node instanceof Element),
          );
          if (arrived) draw();
        });
        arrivals.observe(el, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["value"],
        });
        return () => {
          unsubscribe();
          arrivals.disconnect();
        };
      },
    },
    trigger: { tag: "kind-test-results-trigger", target: wrappedButton, display: "contents" },
    icon: "kind-test-results-icon",
    title: "kind-test-results-title",
    meta: "kind-test-results-meta",
    content: "kind-test-results-content",
    filter: "kind-test-results-filter",
    count: { tag: "kind-test-results-count", target: wrappedButton, display: "contents" },
    tree: "kind-test-results-tree",
    item: "kind-test-results-item",
    "item-status": "kind-test-results-item-status",
    failure: "kind-test-results-failure",
    empty: "kind-test-results-empty",
  });
}

export type KindTestResultsEvents = {
  openchange: UiChangeEvent<boolean, StepOpenChangeReason>;
  filterchange: UiChangeEvent<TestResultsFilter, TestResultsFilterChangeReason>;
  expandchange: UiChangeEvent<string[], TestResultsExpandedChangeReason>;
};

export interface KindTestResultsElement
  extends UiElement<KindTestResultsEvents>,
    AttributeProperties<
      typeof testResultsPrimitive,
      "api" | "open" | "suites" | "filter" | "expanded" | "defaultExpanded"
    > {
  open: boolean;
  suites?: TestResultsOptions["suites"];
  get filter(): TestResultsFilter;
  set filter(filter: TestResultsFilter);
  get expanded(): string[];
  set expanded(values: string[]);
  defaultExpanded?: string[];
  api: Pick<
    TestResultsApi,
    | "isOpen"
    | "setOpen"
    | "toggle"
    | "expand"
    | "collapse"
    | "getSuites"
    | "getFilter"
    | "setFilter"
    | "getExpanded"
    | "setExpanded"
  >;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-test-results": KindTestResultsElement;
    "kind-test-results-trigger": HTMLElement;
    "kind-test-results-icon": HTMLElement;
    "kind-test-results-title": HTMLElement;
    "kind-test-results-meta": HTMLElement;
    "kind-test-results-content": HTMLElement;
    "kind-test-results-filter": HTMLElement;
    "kind-test-results-count": UiPartElement<typeof testResultsPrimitive, "count", "value">;
    "kind-test-results-tree": HTMLElement;
    "kind-test-results-item": HTMLElement;
    "kind-test-results-item-status": HTMLElement;
    "kind-test-results-failure": HTMLElement;
    "kind-test-results-empty": HTMLElement;
  }
}
