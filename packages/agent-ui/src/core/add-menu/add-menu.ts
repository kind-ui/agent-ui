import { type ChangeDetails, definePrimitive, dispatch, type SlotDefinition } from "@ui-sdk/core";
import type { MenuData } from "@ui-sdk/core/menu";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { MenuEntry } from "../../types/index.js";
import {
  type MenuBaseApi,
  type MenuBaseOptions,
  type MenuBaseSlots,
  type MenuBaseState,
  menuBase,
  menuItems,
} from "../menu-base.js";

/** `"item-press"`: a person chose an item. `"imperative"`: an `api` call, like an agent's `run`. */
export type AddMenuActionReason = "item-press" | "imperative";

export type AddMenuOptions = MenuBaseOptions & {
  /**
   * What the menu offers, grouped by their `group` in the order groups first appear, each group under its label. An
   * entry with `items` opens a submenu of them. Every `id` is unique across all levels. The primitive passes each
   * `icon` through to the render layer untouched.
   * @default []
   */
  items?: MenuEntry<unknown>[];
  /**
   * Names the trigger, an icon button.
   * @default "Add"
   */
  label?: string;
  /**
   * Called when a person or `run` runs an item, by its `id`. Cancel it to keep the menu open. Without it, every item
   * is disabled.
   */
  onAction?: (id: string, details: ChangeDetails<AddMenuActionReason>) => void;
};

/** A row of the menu: an item that runs, or one that opens a submenu of its own sections. */
export type AddMenuRow = {
  id: string;
  label: string;
  description: string | undefined;
  /** Passed through untouched, for the render layer to draw. */
  icon: unknown;
  disabled: boolean;
  /** A submenu's rows, or `undefined` for an item that runs. */
  sections: AddMenuSection[] | undefined;
};

/** A run of rows under one `group`, or the entries without one. */
export type AddMenuSection = { label: string | undefined; rows: AddMenuRow[] };

/** What the content slot hands render functions: the rows to draw inside UI SDK's `MenuContent`. */
export type AddMenuContentState = { sections: AddMenuSection[] };

export type AddMenuState = MenuBaseState & {
  entries: MenuEntry<unknown>[];
  /** Whether `onAction` is set; without it every item is disabled. */
  canRun: boolean;
};

export type AddMenuApi = MenuBaseApi & {
  /** Runs an item by its `id`, leaving the menu as it is. Offered only while `onAction` is set and the menu is enabled. */
  readonly run: ((id: string) => boolean) | undefined;
  /** The content slot's state, memoized. */
  contentState: (state: AddMenuState) => AddMenuContentState;
};

type AddMenuSlots = Omit<MenuBaseSlots<AddMenuState, AddMenuApi>, "content"> & {
  content: SlotDefinition<AddMenuState, AddMenuApi, BaseSlotProps, AddMenuContentState>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type AddMenuPrimitive = ReturnType<
  typeof definePrimitive<AddMenuOptions, AddMenuState, AddMenuApi, AddMenuSlots>
>;

const NO_ENTRIES: MenuEntry<unknown>[] = [];

/** The entries as sections: grouped by `group` in first-seen order, each submenu grouped the same way. */
export const addMenuSections = (entries: MenuEntry<unknown>[], canRun: boolean): AddMenuSection[] => {
  const sections = new Map<string | undefined, AddMenuSection>();
  for (const entry of entries) {
    let section = sections.get(entry.group);
    if (!section) {
      section = { label: entry.group, rows: [] };
      sections.set(entry.group, section);
    }
    const sub = entry.items && addMenuSections(entry.items, canRun);
    section.rows.push({
      id: entry.id,
      label: entry.label,
      description: entry.description,
      icon: entry.icon,
      disabled: (entry.disabled ?? false) || (!sub && !canRun),
      sections: sub,
    });
  }
  return [...sections.values()];
};

const toData = (sections: AddMenuSection[]): MenuData =>
  sections.flatMap((section, index): MenuData => {
    const items = section.rows.map((row) =>
      row.sections
        ? { type: "submenu" as const, label: row.label, items: toData(row.sections), disabled: row.disabled }
        : { value: row.id, label: row.label, disabled: row.disabled },
    );
    return [
      ...(index > 0 ? [{ type: "separator" as const }] : []),
      ...(section.label === undefined ? items : [{ type: "group" as const, label: section.label, items }]),
    ];
  });

// Sections are cached per `items` array, one for each `canRun`, so equal options keep one object.
const runnable = new WeakMap<MenuEntry<unknown>[], AddMenuSection[]>();
const inert = new WeakMap<MenuEntry<unknown>[], AddMenuSection[]>();
const sectionsOf = (entries: MenuEntry<unknown>[], canRun: boolean) => {
  const cache = canRun ? runnable : inert;
  let sections = cache.get(entries);
  if (!sections) {
    sections = addMenuSections(entries, canRun);
    cache.set(entries, sections);
  }
  return sections;
};

const canRunOf = (options: AddMenuOptions) => typeof options.onAction === "function";

const base = menuBase<AddMenuOptions>({
  kind: "add-menu",
  label: "Add",
  toData: (options) => toData(sectionsOf(options.items ?? NO_ENTRIES, canRunOf(options))),
  onAction: (id, { event, source, keepOpen }, context) => {
    if (!canRunOf(context.options())) return;
    if (dispatch(context, "onAction", id, { reason: "item-press", source, ...(event && { event }) }))
      keepOpen();
  },
});

const own = (options: AddMenuOptions) => ({
  entries: options.items ?? NO_ENTRIES,
  canRun: canRunOf(options),
});

export const addMenuPrimitive: AddMenuPrimitive = definePrimitive<
  AddMenuOptions,
  AddMenuState,
  AddMenuApi,
  AddMenuSlots
>({
  name: "kind-add-menu",
  options: { ...base.options, items: "value", onAction: "callback" },
  state: (options) => ({ ...base.state(options), ...own(options) }),
  sync: (options) => ({ ...base.sync(options), ...own(options) }),
  controlled: base.controlled,
  api: (context) => {
    const { store } = context;
    const menu = base.api(context);
    const run = (id: string) => {
      const item = menuItems(menu.getItems()).find((entry) => entry.value === id);
      if (!item || item.disabled) return false;
      return !dispatch(context, "onAction", id, { reason: "imperative" });
    };
    let last: { entries: MenuEntry<unknown>[]; canRun: boolean; value: AddMenuContentState } | undefined;
    return {
      controller: menu.controller,
      isOpen: menu.isOpen,
      setOpen: menu.setOpen,
      get open() {
        return menu.open;
      },
      get close() {
        return menu.close;
      },
      getItems: menu.getItems,
      partState: menu.partState,
      composedEvents: menu.composedEvents,
      get run() {
        const { canRun, disabled } = store.get();
        return canRun && !disabled ? run : undefined;
      },
      contentState: ({ entries, canRun }) => {
        if (last?.entries !== entries || last.canRun !== canRun)
          last = { entries, canRun, value: { sections: sectionsOf(entries, canRun) } };
        return last.value;
      },
    };
  },
  slots: (slot) => {
    const slots = base.slots(slot);
    return {
      ...slots,
      content: slot<BaseSlotProps, AddMenuContentState>({
        ...slots.content,
        state: (state, { api }) => api.contentState(state),
      }),
    };
  },
  agent: { ...base.agent, actions: [...base.agent.actions, "run"] },
});
