import type { PickerAction, PickerItem } from "../../types/index.js";

/** What a row is: one of the `items`, one of the footer `actions`, or the way back from a page. */
export type PickerRowKind = "item" | "action" | "back";

/** The props a row hands UI SDK's `CommandItem`: pass every key to it. */
export type PickerOption = {
  /** The row's key in the list, unique across items, actions and pages. */
  value: string;
  /** What the search matches. */
  label: string;
  /** More words the search matches: the item's `keywords` and its description. */
  keywords: string[] | undefined;
  disabled: boolean;
  /** The page choosing it opens, for an item with `items`. */
  page: string | undefined;
  /** Whether it's the chosen item, while the picker shows a check. */
  "aria-checked": "true" | "false" | undefined;
};

export type PickerRow = {
  kind: PickerRowKind;
  /** The item's `value` or the action's `id`; for the way back, the page's item. */
  value: string;
  label: string;
  description: string | undefined;
  meta: string | undefined;
  icon: unknown;
  /** Whether choosing it opens a page. */
  opens: boolean;
  option: PickerOption;
};

/** A run of rows under one label: a `group` of items, or the footer, which has none. */
export type PickerSection = { label: string | undefined; footer: boolean; rows: PickerRow[] };

/** A page of the list: the first, then one per item with `items`, named by that item's row key. */
export type PickerPage = { page: string | undefined; sections: PickerSection[] };

// Items, actions and the way back share UI SDK Command's values, so each kind gets its own prefix.
export const itemKey = (value: string) => `i:${value}`;
const actionKey = (id: string) => `a:${id}`;
const backKey = (page: string) => `b:${page}`;

/** The item a row key or page names. */
export const keyValue = (key: string) => key.slice(2);

/** Which kind of row a key names. */
export const keyKind = (key: string): PickerRowKind =>
  key.startsWith("a:") ? "action" : key.startsWith("b:") ? "back" : "item";

const option = (value: string, label: string, rest: Partial<PickerOption> = {}): PickerOption => ({
  value,
  label,
  keywords: undefined,
  disabled: false,
  page: undefined,
  "aria-checked": undefined,
  ...rest,
});

const itemRow = (item: PickerItem<unknown>, chosen: string | null, check: boolean): PickerRow => {
  const opens = item.items !== undefined;
  const keywords = [...(item.keywords ?? []), ...(item.description ? [item.description] : [])];
  return {
    kind: "item",
    value: item.value,
    label: item.label,
    description: item.description,
    meta: item.meta,
    icon: item.icon,
    opens,
    option: option(itemKey(item.value), item.label, {
      keywords: keywords.length ? keywords : undefined,
      disabled: item.disabled ?? false,
      page: opens ? itemKey(item.value) : undefined,
      "aria-checked": check && !opens ? (item.value === chosen ? "true" : "false") : undefined,
    }),
  };
};

const actionRow = (action: PickerAction<unknown>): PickerRow => ({
  kind: "action",
  value: action.id,
  label: action.label,
  description: action.description,
  meta: undefined,
  icon: action.icon,
  opens: false,
  option: option(actionKey(action.id), action.label, {
    keywords: action.description ? [action.description] : undefined,
  }),
});

const backRow = (page: string, label: string): PickerRow => ({
  kind: "back",
  value: keyValue(page),
  label,
  description: undefined,
  meta: undefined,
  icon: undefined,
  opens: false,
  option: option(backKey(page), label),
});

/**
 * The list as pages of sections: each page's items under their `group`s in the order groups first appear, then a
 * footer, which holds the `actions` on the first page and the way back on the others. The `chosen` item is
 * `aria-checked` while `check` is on.
 */
export function pickerPages(
  items: PickerItem<unknown>[],
  actions: PickerAction<unknown>[],
  { chosen, check, backLabel }: { chosen: string | null; check: boolean; backLabel: string },
): PickerPage[] {
  const pages: PickerPage[] = [];
  const visit = (level: PickerItem<unknown>[], page: string | undefined) => {
    const sections: PickerSection[] = [];
    const groups = new Map<string | undefined, PickerSection>();
    for (const item of level) {
      let section = groups.get(item.group);
      if (!section) {
        section = { label: item.group, footer: false, rows: [] };
        groups.set(item.group, section);
        sections.push(section);
      }
      section.rows.push(itemRow(item, chosen, check));
    }
    const footer = page === undefined ? actions.map(actionRow) : [backRow(page, backLabel)];
    if (footer.length) sections.push({ label: undefined, footer: true, rows: footer });
    pages.push({ page, sections });
    for (const item of level) if (item.items) visit(item.items, itemKey(item.value));
  };
  visit(items, undefined);
  return pages;
}

/** Every item that can be chosen, through every page. */
export const pickerLeaves = (items: PickerItem<unknown>[]): PickerItem<unknown>[] =>
  items.flatMap((item) => (item.items ? pickerLeaves(item.items) : [item]));
