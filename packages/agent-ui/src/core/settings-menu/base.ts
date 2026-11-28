import {
  type ChangeDetails,
  type ChangeSource,
  createChange,
  type PrimitiveContext,
  type SlotDefinition,
  type SlotFactory,
} from "@ui-sdk/core";
import type { MenuData } from "@ui-sdk/core/menu";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { SettingsEntry, SettingsOption, SettingsValues } from "../../types/index.js";
import { cached, memo } from "../memo.js";
import {
  type MenuBaseApi,
  type MenuBaseConfig,
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

/** A settings menu's options: the menu's, plus its settings and their values. */
export type SettingsBaseOptions = MenuBaseOptions & {
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
};

/** A switch row. */
export type SettingsMenuToggleRow = {
  type: "toggle";
  /** The setting's `id`, which the checkbox item takes as its `value`. */
  id: string;
  /** The first line, and the text typeahead matches. */
  label: string;
  /** The second line, under the label. */
  description: string | undefined;
  /** Passed through untouched, for the render layer to draw. */
  icon: unknown;
  /** Whether the toggle is on: its value is `true`. */
  checked: boolean;
};

/** A run of a choice's options under a `group` label, or under none. */
export type SettingsMenuOptionGroup = { label: string | undefined; options: SettingsOption<unknown>[] };

/** A plain item after a choice's options, which runs rather than chooses, like "More models". */
export type SettingsMenuAction = {
  /** The item's value in UI SDK Menu, apart from every option's. */
  value: string;
  /** Its text, which typeahead matches. */
  label: string;
  /** Passed through untouched, for the render layer to draw. */
  icon: unknown;
};

/** A row of options, one of them chosen: a submenu, or a section of the menu itself while `inline`. */
export type SettingsMenuChoiceRow = {
  type: "choice";
  /**
   * Whether the options sit in the menu itself, under their group labels (the row's `label` for options without a
   * group), rather than in a submenu.
   */
  inline: boolean;
  /** The setting's `id`, which names its radio groups. */
  id: string;
  /** The submenu trigger's text before the value, and the text typeahead matches. */
  label: string;
  /** Passed through untouched, for the render layer to draw. */
  icon: unknown;
  /** Every option, in order: the trigger stacks their labels so it keeps its width. */
  options: SettingsOption<unknown>[];
  /** The options by `group`, in first-seen order: a labelled group for each. */
  groups: SettingsMenuOptionGroup[];
  /** Items after the options, behind a separator. */
  actions: SettingsMenuAction[];
  /** A line after the options and actions, behind a separator, like what a model's cost means. */
  note: string | undefined;
  /** The chosen option's `value`, or `undefined` while none is. */
  value: string | undefined;
};

export type SettingsMenuRow = SettingsMenuToggleRow | SettingsMenuChoiceRow;

/** What the content slot hands render functions: the rows to draw inside UI SDK's `MenuContent`. */
export type SettingsMenuContentState = { rows: SettingsMenuRow[] };

export type SettingsBaseState = MenuBaseState & {
  /** The host's `settings` as passed, icons included. */
  entries: SettingsEntry<unknown>[];
  /** The values by setting `id`, which the agent snapshot shows. */
  values: SettingsValues;
};

export type SettingsBaseApi = MenuBaseApi & {
  /** The values by setting `id`: the `values` passed, or what changed since `defaultValues`. */
  getValues: () => SettingsValues;
  /**
   * Changes each setting whose value differs in `values`, one change each, as the web root's `values` property does.
   * Returns whether every change was accepted; unknown ids and values are refused.
   */
  setValues: (values: SettingsValues) => boolean;
  /** The rows an agent can change, or none while disabled. */
  getSettings: () => SettingsMenuRow[];
  /**
   * Turns a toggle on or off by its `id`, or flips it without `on`. Offered only while the menu is enabled and holds a
   * toggle. Returns whether the change was accepted: `false` for an id that isn't a toggle, or one the owner cancelled.
   */
  readonly toggle: ((id: string, on?: boolean) => boolean) | undefined;
  /**
   * Chooses a choice setting's option by their `id` and `value`. Offered only while the menu is enabled and holds a
   * choice. Returns whether the change was accepted: `false` for an unknown id, an unknown or disabled value, or one
   * the owner cancelled.
   */
  readonly setValue: ((id: string, value: string) => boolean) | undefined;
  /** The content slot's state, memoized. */
  contentState: (state: SettingsBaseState) => SettingsMenuContentState;
};

export type SettingsBaseSlots<State extends SettingsBaseState, Api extends SettingsBaseApi> = Omit<
  MenuBaseSlots<State, Api>,
  "content"
> & {
  content: SlotDefinition<State, Api, BaseSlotProps, SettingsMenuContentState>;
};

/** Why a setting changed, as `change` takes it. */
export type SettingsCause = { reason: string; event?: Event; source?: ChangeSource };

type Context<Options> = PrimitiveContext<Options, SettingsBaseState, string>;

export type SettingsBaseConfig<Options extends SettingsBaseOptions> = Pick<
  MenuBaseConfig<Options>,
  "kind" | "label" | "onAction"
> & {
  /** The menu as UI SDK Menu data, for the agent's items: `settingsData(settings)` and anything the component adds. */
  toData: (options: Options) => MenuData;
  /** Builds the rows the state draws, once per instance, in place of the `settings`' own. */
  rows?: (context: Context<Options>) => (state: SettingsBaseState) => SettingsMenuRow[];
  /**
   * Commits a change of a row the component owns, by its `id`, and returns whether it was accepted; `undefined`
   * leaves it to `values`.
   */
  commit?: (
    id: string,
    value: boolean | string,
    cause: SettingsCause,
    context: Context<Options>,
  ) => boolean | undefined;
  /**
   * The stored value of a row the component owns, which a change is compared with, since its row may show another;
   * `undefined` for a row that isn't its own.
   */
  stored?: (id: string, state: SettingsBaseState) => boolean | string | null | undefined;
};

const NO_SETTINGS: SettingsEntry<unknown>[] = [];
const NO_VALUES: SettingsValues = {};
const NO_ACTIONS: SettingsMenuAction[] = [];

// Own keys only, so a setting named like an `Object.prototype` member reads no inherited value.
const ownValue = (values: SettingsValues, id: string) => (Object.hasOwn(values, id) ? values[id] : undefined);

const grouped = new WeakMap<SettingsOption<unknown>[], SettingsMenuOptionGroup[]>();

/** The options by `group`, in first-seen order, kept while the host keeps its array. */
export const settingsGroups = (options: SettingsOption<unknown>[]): SettingsMenuOptionGroup[] =>
  cached(grouped, options, () => {
    const groups = new Map<string | undefined, SettingsMenuOptionGroup>();
    for (const option of options) {
      let group = groups.get(option.group);
      if (!group) {
        group = { label: option.group, options: [] };
        groups.set(option.group, group);
      }
      group.options.push(option);
    }
    return [...groups.values()];
  });

const labelled = new WeakMap<SettingsOption<unknown>[], Map<string, SettingsMenuOptionGroup[]>>();

/** `settingsGroups`, with `label` on the options that have no group, kept while the host keeps its array. */
const labelledGroups = (options: SettingsOption<unknown>[], label: string) => {
  const byLabel = cached(labelled, options, () => new Map<string, SettingsMenuOptionGroup[]>());
  let groups = byLabel.get(label);
  if (!groups) {
    groups = settingsGroups(options).map((group) =>
      group.label === undefined ? { ...group, label } : group,
    );
    byLabel.set(label, groups);
  }
  return groups;
};

/** A choice row, for a component that adds one of its own. A `value` that isn't an enabled option shows none. */
export const settingsChoiceRow = (
  setting: Pick<SettingsMenuChoiceRow, "id" | "label" | "options"> & {
    icon?: unknown;
    actions?: SettingsMenuAction[];
    /** Whether the options sit in the menu itself. @default false */
    inline?: boolean;
    note?: string | undefined;
  },
  value: unknown,
): SettingsMenuChoiceRow => ({
  type: "choice",
  inline: setting.inline ?? false,
  id: setting.id,
  label: setting.label,
  icon: setting.icon,
  options: setting.options,
  groups: setting.inline ? labelledGroups(setting.options, setting.label) : settingsGroups(setting.options),
  actions: setting.actions ?? NO_ACTIONS,
  note: setting.note || undefined,
  value: setting.options.some((option) => option.value === value && !option.disabled)
    ? (value as string)
    : undefined,
});

/** The rows the settings and values draw. */
export const settingsMenuRows = (
  settings: SettingsEntry<unknown>[],
  values: SettingsValues,
): SettingsMenuRow[] =>
  settings.map((setting) =>
    setting.type === "toggle"
      ? {
          type: "toggle",
          id: setting.id,
          label: setting.label,
          description: setting.description,
          icon: setting.icon,
          checked: ownValue(values, setting.id) === true,
        }
      : settingsChoiceRow(setting, ownValue(values, setting.id)),
  );

const data = new WeakMap<SettingsEntry<unknown>[], MenuData>();

/** The settings as UI SDK Menu data: each radio group named by its setting's `id`. */
export const settingsData = (settings: SettingsEntry<unknown>[]): MenuData =>
  cached(data, settings, () =>
    settings.map((setting) =>
      setting.type === "toggle"
        ? { type: "checkbox" as const, value: setting.id, label: setting.label }
        : {
            type: "submenu" as const,
            label: setting.label,
            items: [
              {
                type: "radio-group" as const,
                name: setting.id,
                items: setting.options.map(({ value, label, disabled }) => ({
                  value,
                  label,
                  ...(disabled && { disabled }),
                })),
              },
            ],
          },
    ),
  );

const fits = (row: SettingsMenuRow | undefined, value: unknown) =>
  row?.type === "toggle"
    ? typeof value === "boolean"
    : !!row?.options.some((option) => option.value === value && !option.disabled);

const cause = ({ reason, event, source }: MenuChoice): SettingsCause => ({
  reason,
  source,
  ...(event && { event }),
});

// Each instance's `change`, by its context: `menuBase` hands a person's choice to the config with the context only.
const changes = new WeakMap<object, (id: string, value: boolean | string, cause: SettingsCause) => boolean>();

/**
 * Everything but the name of a settings menu over `menuBase`: toggles drawn as switches and choices in submenus, for
 * Settings Menu and Model Control to spread into their own `definePrimitive`. A component adds rows through `rows`
 * and takes their changes through `commit`; every other change is a `values` change.
 */
export const settingsBase = <Options extends SettingsBaseOptions>(config: SettingsBaseConfig<Options>) => {
  const base = menuBase<Options>({
    sharedTrigger: "icon-button",
    kind: config.kind,
    label: config.label,
    toData: config.toData,
    ...(config.onAction && { onAction: config.onAction }),
    onChecked: (id, checked, choice, context) => {
      if (!changes.get(context)?.(id, checked, cause(choice))) choice.cancel();
    },
    onValue: (id, value, choice, context) => {
      if (!changes.get(context)?.(id, value, cause(choice))) choice.cancel();
    },
  });
  const own = (options: Options) => ({ entries: options.settings ?? NO_SETTINGS });

  return {
    options: {
      ...base.options,
      settings: "value",
      values: "value",
      defaultValues: "value",
      onValuesChange: "callback",
    } as const,
    state: (options: Options): SettingsBaseState => ({
      ...base.state(options),
      ...own(options),
      values: options.values ?? options.defaultValues ?? NO_VALUES,
    }),
    sync: (options: Options): Partial<SettingsBaseState> => ({
      ...base.sync(options),
      ...own(options),
      ...(options.values === undefined ? {} : { values: options.values }),
    }),
    controlled: [...base.controlled, "values"] as ("open" | "values")[],
    api: (context: Context<Options>): SettingsBaseApi => {
      const { store } = context;
      const menu = base.api(context);
      // `createChange` reads reasons from the options type, which a generic `Options` hides.
      const changeValues = createChange(
        context as unknown as PrimitiveContext<SettingsBaseOptions, SettingsBaseState, string>,
      );
      const own = memo((entries: SettingsEntry<unknown>[], values: SettingsValues) =>
        settingsMenuRows(entries, values),
      );
      const rows = config.rows?.(context) ?? ((state: SettingsBaseState) => own(state.entries, state.values));
      const find = (id: string, state = store.get()) => rows(state).find((row) => row.id === id);
      const current = (row: SettingsMenuRow) => {
        const stored = config.stored?.(row.id, store.get());
        return stored !== undefined ? stored : row.type === "toggle" ? row.checked : row.value;
      };

      // Whether the last change went through the component's `commit` rather than `values`.
      let owned = false;
      // `values` is what a `values` change builds on: a controlled store keeps the owner's until it passes new ones.
      const change = (
        id: string,
        value: boolean | string,
        cause: SettingsCause,
        values = store.get().values,
      ) => {
        owned = false;
        const row = find(id);
        if (store.get().disabled || !row || !fits(row, value)) return false;
        if (current(row) === value) return true;
        const committed = config.commit?.(id, value, cause, context);
        owned = committed !== undefined;
        return (
          committed ??
          changeValues(
            "values",
            { ...values, [id]: value },
            { ...cause, reason: cause.reason as SettingsMenuChangeReason, id },
          )
        );
      };
      changes.set(context, change);

      const offers = (type: SettingsMenuRow["type"]) => {
        const state = store.get();
        return !state.disabled && rows(state).some((row) => row.type === type);
      };
      const contentState = memo((shown: SettingsMenuRow[]): SettingsMenuContentState => ({ rows: shown }));

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
        setValues: (values) => {
          let next = store.get().values;
          let accepted = true;
          for (const [id, value] of Object.entries(values)) {
            if (!change(id, value, { reason: "imperative" }, next)) accepted = false;
            // A row the component owns keeps its value out of `values`.
            else if (!owned) next = { ...next, [id]: value };
          }
          return accepted;
        },
        getSettings: () => (store.get().disabled ? [] : rows(store.get())),
        get toggle() {
          return offers("toggle")
            ? (id: string, on?: boolean) => {
                const row = find(id);
                return row?.type === "toggle" && change(id, on ?? !row.checked, { reason: "imperative" });
              }
            : undefined;
        },
        get setValue() {
          return offers("choice")
            ? (id: string, value: string) =>
                find(id)?.type === "choice" && change(id, value, { reason: "imperative" })
            : undefined;
        },
        contentState: (state) => contentState(rows(state)),
      };
    },
    slots: <State extends SettingsBaseState, Api extends SettingsBaseApi>(
      slot: SlotFactory<State, Api>,
    ): SettingsBaseSlots<State, Api> => {
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
      // The bridge checks every action's first argument against one list: the row ids.
      items: (api: SettingsBaseApi) => api.getSettings().map((row) => ({ value: row.id, label: row.label })),
    },
  };
};
