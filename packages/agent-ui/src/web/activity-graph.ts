import {
  type ActivityGraphApi,
  type ActivityGraphOptions,
  type ActivityGraphState,
  activityGraphPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/web";
import type {
  AttributeProperties,
  UiDetailedChangeEvent,
  UiElement,
  UiPartElement,
} from "@ui-sdk/web/events";

const DEFAULT_PARTS = `<kind-activity-graph-viewport><kind-activity-graph-grid><kind-activity-graph-months></kind-activity-graph-months></kind-activity-graph-grid></kind-activity-graph-viewport><kind-activity-graph-legend><span></span><span></span></kind-activity-graph-legend><kind-activity-graph-summary></kind-activity-graph-summary>`;

// What each element filled in was last drawn from. A graph someone wrote parts into keeps them, as React's children
// do. Kept across instances, because UI SDK rebuilds one when the element returns to the page.
const drawn = new WeakMap<Element, { model?: unknown; grid?: unknown; legend?: unknown }>();

const element = (document: Document, tag: string, attributes: Record<string, string>) => {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value);
  return el;
};

const setText = (el: Element | null | undefined, text: string) => {
  if (el && el.textContent !== text) el.textContent = text;
};

const draw = (el: Element, state: ActivityGraphState, api: ActivityGraphApi) => {
  const last = drawn.get(el);
  if (!last) return;
  const model = api.model(state);
  const grid = api.gridState(state);
  const legend = api.legendState(state);
  if (last.model === model && last.grid === grid && last.legend === legend) return;
  const document = el.ownerDocument;

  const gridEl = el.querySelector("kind-activity-graph-grid");
  if (gridEl && last.grid !== grid) {
    gridEl.querySelectorAll(":scope > kind-activity-graph-row").forEach((row) => {
      row.remove();
    });
    for (const row of grid.rows) {
      const rowEl = element(document, "kind-activity-graph-row", { value: row.value });
      rowEl.append(element(document, "kind-activity-graph-weekday", { value: row.value }));
      for (const cell of row.cells)
        rowEl.append(
          element(document, "kind-activity-graph-cell", {
            value: cell.value,
            row: String(cell.row),
            col: String(cell.col),
          }),
        );
      gridEl.append(rowEl);
    }
  }
  el.querySelectorAll("kind-activity-graph-weekday").forEach((weekday, row) => {
    setText(weekday, model.weekdays[row]?.short ?? "");
  });

  const months = el.querySelector("kind-activity-graph-months");
  if (months) {
    const values = model.months.map((month) => String(month.col));
    const current = [...months.children].map((month) => month.getAttribute("value"));
    if (current.join() !== values.join())
      months.replaceChildren(
        ...values.map((value) => element(document, "kind-activity-graph-month", { value })),
      );
    [...months.children].forEach((month, index) => {
      setText(month, model.months[index]?.label ?? "");
    });
  }

  const legendEl = el.querySelector("kind-activity-graph-legend");
  if (legendEl && last.legend !== legend) {
    const [less, more] = legendEl.querySelectorAll(":scope > span");
    legendEl.replaceChildren(
      less ?? document.createElement("span"),
      ...legend.levels.map(({ value }) => element(document, "kind-activity-graph-swatch", { value })),
      more ?? document.createElement("span"),
    );
    setText(legendEl.firstElementChild, legend.less);
    setText(legendEl.lastElementChild, legend.more);
  }

  setText(el.querySelector("kind-activity-graph-summary"), model.summary);
  drawn.set(el, { model, grid, legend });
};

/**
 * `<kind-activity-graph can-select>` fills in its parts when it has no children. Set `days` as a property; the
 * `can-select` attribute lets a person choose a day, which fires `dayselect` with its date as `detail.value`.
 */
export function defineActivityGraph(): void {
  if (customElements.get("kind-activity-graph")) return;
  createParts(activityGraphPrimitive, {
    root: {
      tag: "kind-activity-graph",
      kinds: { canSelect: "boolean" },
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => ((el as KindActivityGraphElement).canSelect ? {} : { onSelect: undefined }),
      // A native `select` bubbles from text fields.
      events: { onSelect: "dayselect" },
      render: (el, instance) => {
        if (!el.firstElementChild && !drawn.has(el)) {
          el.innerHTML = DEFAULT_PARTS;
          drawn.set(el, {});
        }
        const redraw = () => draw(el, instance.get() as ActivityGraphState, instance.api as ActivityGraphApi);
        redraw();
        return instance.subscribe(redraw);
      },
    },
    viewport: "kind-activity-graph-viewport",
    grid: "kind-activity-graph-grid",
    months: "kind-activity-graph-months",
    month: "kind-activity-graph-month",
    row: "kind-activity-graph-row",
    weekday: "kind-activity-graph-weekday",
    cell: "kind-activity-graph-cell",
    legend: "kind-activity-graph-legend",
    swatch: "kind-activity-graph-swatch",
    summary: "kind-activity-graph-summary",
  });
}

export type KindActivityGraphEvents = {
  dayselect: UiDetailedChangeEvent<string, Parameters<NonNullable<ActivityGraphOptions["onSelect"]>>[1]>;
};

export interface KindActivityGraphElement
  extends UiElement<KindActivityGraphEvents>,
    AttributeProperties<typeof activityGraphPrimitive, "days"> {
  canSelect: boolean;
  days?: ActivityGraphOptions["days"];
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-activity-graph": KindActivityGraphElement;
    "kind-activity-graph-viewport": HTMLElement;
    "kind-activity-graph-grid": HTMLElement;
    "kind-activity-graph-months": HTMLElement;
    "kind-activity-graph-month": UiPartElement<typeof activityGraphPrimitive, "month", "value">;
    "kind-activity-graph-row": UiPartElement<typeof activityGraphPrimitive, "row", "value">;
    "kind-activity-graph-weekday": UiPartElement<typeof activityGraphPrimitive, "weekday", "value">;
    "kind-activity-graph-cell": UiPartElement<typeof activityGraphPrimitive, "cell", "value" | "row" | "col">;
    "kind-activity-graph-legend": HTMLElement;
    "kind-activity-graph-swatch": UiPartElement<typeof activityGraphPrimitive, "swatch", "value">;
    "kind-activity-graph-summary": HTMLElement;
  }
}
