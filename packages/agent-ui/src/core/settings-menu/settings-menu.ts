import {
  type ChangeDetails,
  type ChangeSource,
  createChange,
  definePrimitive,
  type SlotDefinition,
} from "@ui-sdk/core";
import type { MenuData } from "@ui-sdk/core/menu";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { SettingsEntry, SettingsOption, SettingsValues } from "../../types/index.js";
import { cached, memo } from "../memo.js";
import {
  type MenuBaseApi,
  type MenuBaseOptions,
  type MenuBaseSlots,
  type MenuBaseState,
  type MenuChoice,
  menuBase,
} from "../menu-base.js";

/** `"item-press"`: a person toggled or chose in the menu. `"imperative"`: an `api` call, like an agent's `toggle`. */
export type SettingsMenuChangeReason = "item-press" | "imperative";

/** A change's details, with the `id` of the setting that changed. */
export type SettingsMenuChangeDetails = ChangeDetails<SettingsMenuChangeReason> & { id: string };

export type SettingsMenuOptions = MenuBaseOptions & {
  /**
   * The rows, in order: a `toggle` is a switch that keeps the menu open, a `choice` a submenu of its `options` showing
   * the current one. Every `id` is unique. The primitive passes each `icon` through to the render layer untouched.
   * @default []
   */
  settings?: SettingsEntry<unknown>[];
  /** The values by setting `id`. Passing it controls them: change them in `onValuesChange`. */
  values?: SettingsValues;
  /**
   * The values at first, when `values` isn't passed. A toggle without one is off; a choice without one shows none.
   * @default {}
   */
  defaultValues?: SettingsValues;
  /** Called once per setting a person or an `api` call changes, with every value and the setting's `id` in `details`. */
  onValuesChange?: (values: SettingsValues, details: SettingsMenuChangeDetails) => void;
  /**
   * Names the trigger, an icon button.
   * @default "Settings"
   */
  label?: string;
};

/** A switch row. */
export type SettingsMenuToggleRow = {
  type: "toggle";
  id: string;
  label: string;
  /** The second line, under the label. */
  description: string | undefined;
  /** Passed through untouched, for the render layer to draw. */
  icon: unknown;
  checked: boolean;
};

/** A row that opens a submenu of options, one of them chosen. */
export type SettingsMenuChoiceRow = {
  type: "choice";
  id: string;
  label: string;
  /** Passed through untouched, for the render layer to draw. */
  icon: unknown;
  options: SettingsOption[];
  /** The chosen option's `value`, or `undefined` while none is. */
  value: string | undefined;
};

export type SettingsMenuRow = SettingsMenuToggleRow | SettingsMenuChoiceRow;

/** What the content slot hands render functions: the rows to draw inside UI SDK's `MenuContent`. */
export type SettingsMenuContentState = { rows: SettingsMenuRow[] };

export type SettingsMenuState = MenuBaseState & {
  /** The host's `settings` as passed, icons included. */
  entries: SettingsEntry<unknown>[];
  values: SettingsValues;
};

export type SettingsMenuApi = MenuBaseApi & {
  /** The values by setting `id`: the `values` passed, or what changed since `defaultValues`. */
  getValues: () => SettingsValues;
  /**
   * Changes each setting whose value differs in `values`, one change each, as the web root's `values` property does.
   * Returns whether every change was accepted; unknown ids and values are refused.
   */
  setValues: (values: SettingsValues) => boolean;
  /** The settings an agent can change, or none while disabled. */
  getSettings: () => SettingsEntry<unknown>[];
  /**
   * Turns a toggle on or off by its `id`, or flips it without `on`. Offered only while the menu is enabled and holds a
   * toggle. Returns whether the change was accepted: `false` for an id that isn't a toggle, or one the owner cancelled.
   */
  readonly toggle: ((id: string, on?: boolean) => boolean) | undefined;
  /**
   * Chooses a choice setting's option by their `id` and `value`. Offered only while the menu is enabled and holds a
   * choice. Returns whether the change was accepted: `false` for an unknown id or value, or one the owner cancelled.
   */
  readonly setValue: ((id: string, value: string) => boolean) | undefined;
  /** The content slot's state, memoized. */
  contentState: (state: SettingsMenuState) => SettingsMenuContentState;
};

type SettingsMenuSlots = Omit<MenuBaseSlots<SettingsMenuState, SettingsMenuApi>, "content"> & {
  content: SlotDefinition<SettingsMenuState, SettingsMenuApi, BaseSlotProps, SettingsMenuContentState>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type SettingsMenuPrimitive = ReturnType<
  typeof definePrimitive<SettingsMenuOptions, SettingsMenuState, SettingsMenuApi, SettingsMenuSlots>
>;

const NO_SETTINGS: SettingsEntry<unknown>[] = [];
const NO_VALUES: SettingsValues = {};

/** The rows the settings and values draw. A choice whose value isn't one of its options shows none. */
export const settingsMenuRows = (
  settings: SettingsEntry<unknown>[],
  values: SettingsValues,
): SettingsMenuRow[] =>
  settings.map((setting) => {
    const value = values[setting.id];
    if (setting.type === "toggle")
      return {
        type: "toggle",
        id: setting.id,
        label: setting.label,
        description: setting.description,
        icon: setting.icon,
        checked: value === true,
      };
    return {
      type: "choice",
      id: setting.id,
      label: setting.label,
      icon: setting.icon,
      options: setting.options,
      value: setting.options.some((option) => option.value === value) ? (value as string) : undefined,
    };
  });

// UI SDK Menu data names the items, each radio group by its setting's `id`.
const data = new WeakMap<SettingsEntry<unknown>[], MenuData>();
const toData = (settings: SettingsEntry<unknown>[]) =>
  cached(data, settings, () =>
    settings.map((setting) =>
      setting.type === "toggle"
        ? { type: "checkbox" as const, value: setting.id, label: setting.label }
        : {
            type: "submenu" as const,
            label: setting.label,
            items: [{ type: "radio-group" as const, name: setting.id, items: setting.options }],
          },
    ),
  );

type Cause = { reason: SettingsMenuChangeReason; event?: Event; source?: ChangeSource };

const fits = (setting: SettingsEntry<unknown> | undefined, value: unknown) =>
  setting?.type === "toggle"
    ? typeof value === "boolean"
    : !!setting?.options.some((option) => option.value === value);

const cause = ({ reason, event, source }: MenuChoice): Cause => ({
  reason: reason as SettingsMenuChangeReason,
  source,
  ...(event && { event }),
});

// Each instance's `change`, by its context: `menuBase` hands a person's choice to the config with the context only.
const changes = new WeakMap<object, (id: string, value: boolean | string, cause: Cause) => boolean>();

const base = menuBase<SettingsMenuOptions>({
  kind: "settings-menu",
  label: "Settings",
  toData: (options) => toData(options.settings ?? NO_SETTINGS),
  onChecked: (id, checked, choice, context) => {
    if (!changes.get(context)?.(id, checked, cause(choice))) choice.cancel();
  },
  onValue: (id, value, choice, context) => {
    if (!changes.get(context)?.(id, value, cause(choice))) choice.cancel();
  },
});

const own = (options: SettingsMenuOptions) => ({ entries: options.settings ?? NO_SETTINGS });

export const settingsMenuPrimitive: SettingsMenuPrimitive = definePrimitive<
  SettingsMenuOptions,
  SettingsMenuState,
  SettingsMenuApi,
  SettingsMenuSlots
>({
  name: "kind-settings-menu",
  options: {
    ...base.options,
    settings: "value",
    values: "value",
    defaultValues: "value",
    onValuesChange: "callback",
  },
  state: (options) => ({
    ...base.state(options),
    ...own(options),
    values: options.values ?? options.defaultValues ?? NO_VALUES,
  }),
  sync: (options) => ({
    ...base.sync(options),
    ...own(options),
    ...(options.values === undefined ? {} : { values: options.values }),
  }),
  controlled: [...base.controlled, "values"],
  api: (context) => {
    const { store } = context;
    const menu = base.api(context);
    const changeValues = createChange(context);
    const find = (id: string) => store.get().entries.find((setting) => setting.id === id);
    const current = (id: string) =>
      store.get().values[id] ?? (find(id)?.type === "toggle" ? false : undefined);

    const change = (id: string, value: boolean | string, cause: Cause) => {
      if (store.get().disabled || !fits(find(id), value)) return false;
      if (current(id) === value) return true;
      return changeValues("values", { ...store.get().values, [id]: value }, { ...cause, id });
    };
    changes.set(context, change);

    const toggle = (id: string, on?: boolean) =>
      find(id)?.type === "toggle" && change(id, on ?? !current(id), { reason: "imperative" });
    const setValue = (id: string, value: string) =>
      find(id)?.type === "choice" && change(id, value, { reason: "imperative" });
    const offers = (type: SettingsEntry["type"]) => {
      const { disabled, entries } = store.get();
      return !disabled && entries.some((setting) => setting.type === type);
    };

    const rows = memo(
      (entries: SettingsEntry<unknown>[], values: SettingsValues): SettingsMenuContentState => ({
        rows: settingsMenuRows(entries, values),
      }),
    );

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
      getValues: () => store.get().values,
      setValues: (values) =>
        Object.entries(values)
          .map(([id, value]) => current(id) === value || change(id, value, { reason: "imperative" }))
          .every(Boolean),
      getSettings: () => (store.get().disabled ? NO_SETTINGS : store.get().entries),
      get toggle() {
        return offers("toggle") ? toggle : undefined;
      },
      get setValue() {
        return offers("choice") ? setValue : undefined;
      },
      contentState: ({ entries, values }) => rows(entries, values),
    };
  },
  slots: (slot) => {
    const slots = base.slots(slot);
    return {
      ...slots,
      content: slot<BaseSlotProps, SettingsMenuContentState>({
        ...slots.content,
        state: (state, { api }) => api.contentState(state),
      }),
    };
  },
  agent: {
    ...base.agent,
    actions: [...base.agent.actions, "toggle", "setValue"],
    items: (api: SettingsMenuApi) =>
      api.getSettings().map((setting) => ({ value: setting.id, label: setting.label })),
  },
});
