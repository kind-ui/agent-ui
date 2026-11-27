import {
  type ChangeDetails,
  createChange,
  definePrimitive,
  dispatch,
  type PrimitiveContext,
  type SlotDefinition,
} from "@ui-sdk/core";
import type { MenuData } from "@ui-sdk/core/menu";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type {
  EffortLevel,
  ModelOption,
  PickerAction,
  SettingsEntry,
  SettingsOption,
} from "../../types/index.js";
import { costNoteOf, costName as defaultCostName } from "../cost.js";
import { cached, memo } from "../memo.js";
import type { MenuTriggerState } from "../menu-base.js";
import {
  type SettingsBaseApi,
  type SettingsBaseOptions,
  type SettingsBaseSlots,
  type SettingsBaseState,
  type SettingsMenuAction,
  type SettingsMenuChangeReason,
  type SettingsMenuChoiceRow,
  type SettingsMenuRow,
  settingsBase,
  settingsChoiceRow,
  settingsData,
  settingsMenuRows,
} from "../settings-menu/base.js";

/** `"item-press"`: a person chose in the menu. `"imperative"`: an `api` call, like an agent's `setModel`. */
export type ModelControlChangeReason = SettingsMenuChangeReason;

/**
 * What changed the effort: a choice, or `"model-change"` when the chosen model, `models` or `levels` changed so the
 * effort fell back to the highest level the model supports at or below it.
 */
export type ModelControlEffortChangeReason = SettingsMenuChangeReason | "model-change";

/** The Model row's id, which Model Control keeps for itself: a host setting with it is left out. */
export const MODEL_CONTROL_MODEL = "model";
/** The Effort row's id, which Model Control keeps for itself: a host setting with it is left out. */
export const MODEL_CONTROL_EFFORT = "effort";

export type ModelControlOptions = SettingsBaseOptions & {
  /**
   * The models, listed in the menu under their `group`s with their icons. A model's `efforts` names the effort
   * levels it supports; the others show dimmed and are skipped.
   * @default []
   */
  models?: ModelOption<unknown>[];
  /** The chosen model's `id`. Passing it controls it: change it in `onModelChange`. */
  model?: string | null;
  /**
   * The chosen model's `id` at first, when `model` isn't passed.
   * @default null
   */
  defaultModel?: string | null;
  /** Called when a person or `setModel` chooses a model. */
  onModelChange?: (model: string, details: ChangeDetails<ModelControlChangeReason>) => void;
  /**
   * The effort levels, from least to most effort, listed in the menu after the models. Without any, there's no
   * Effort section; the levels the chosen model doesn't support show dimmed.
   * @default []
   */
  levels?: EffortLevel[];
  /**
   * The chosen effort level's `value`. Passing it controls it: change it in `onEffortChange`. One the chosen model
   * doesn't support reads as the highest level it supports at or below it.
   */
  effort?: string;
  /**
   * The chosen effort level's `value` at first, when `effort` isn't passed.
   * @default the middle level
   */
  defaultEffort?: string;
  /**
   * Called when a person or `setEffort` chooses an effort level, or when the chosen model, `models` or `levels`
   * change so the effort falls back to a level the model supports (`"model-change"`). Cancelling a fallback keeps
   * `effort`, but the trigger still shows the level the model uses.
   */
  onEffortChange?: (effort: string, details: ChangeDetails<ModelControlEffortChangeReason>) => void;
  /**
   * Items after the models, like "More models", shown while `onAction` is set.
   * @default []
   */
  actions?: PickerAction<unknown>[];
  /** Called with an action's `id` when a person or `run` runs it. Cancel it to keep the menu open. */
  onAction?: (id: string, details: ChangeDetails<ModelControlChangeReason>) => void;
  /**
   * Names the trigger, with the chosen model and effort after it ("Model, GPT-5, High effort").
   * @default "Model"
   */
  label?: string;
  /**
   * Names the Model row.
   * @default "Model"
   */
  modelLabel?: string;
  /**
   * Names the Effort row, and the effort in the trigger's name.
   * @default "Effort"
   */
  effortLabel?: string;
  /**
   * A line after the models that says what their `cost` means. Empty hides it.
   * @default "Cost per request, relative to the default model." while any model has a `cost`
   */
  costNote?: string;
  /**
   * What screen readers hear after a model's name for its `cost`, in place of the cost as shown.
   * @default ", 3 times the cost" for "3×", ", the same cost" for "1×", else ", " and the cost
   */
  costName?: (cost: string) => string;
};

export type ModelControlState = SettingsBaseState & {
  /** The `models`. */
  models: ModelOption<unknown>[];
  /** The `levels`. */
  levels: EffortLevel[];
  /** The chosen model's `id`. */
  model: string | null;
  /** The effort level the chosen model uses, or the `effort` passed. */
  effort: string | null;
  /** The `actions`, while `onAction` is set. */
  actions: PickerAction<unknown>[];
  /** The `modelLabel`, else "Model". */
  modelLabel: string;
  /** The `effortLabel`, else "Effort". */
  effortLabel: string;
  /** The line after the models, or empty. */
  costNote: string;
  /** The `costName`, else the default. */
  costName: (cost: string) => string;
};

/** What the trigger shows beside UI SDK `MenuTrigger`'s props: the model, and every effort label in one cell. */
export type ModelControlTriggerState = MenuTriggerState & {
  /** The chosen model's name and icon, or the `label` while none is chosen. */
  model: { label: string; icon: unknown };
  /** The levels the chosen model has, and the chosen one's `value`; `undefined` without effort. */
  effort: { options: SettingsOption<unknown>[]; value: string } | undefined;
};

export type ModelControlApi = SettingsBaseApi & {
  /** The chosen model's `id`. */
  getModel: () => string | null;
  /** The effort level the chosen model uses, or `null` without effort. */
  getEffort: () => string | null;
  /**
   * Chooses a model by its `id`. Offered only while enabled. Returns `false` for an unknown or disabled model, or a
   * refused change.
   */
  readonly setModel: ((model: string) => boolean) | undefined;
  /**
   * Chooses an effort level by its `value`. Offered only while enabled and the chosen model has effort levels.
   * Returns `false` for an unknown level, one the model doesn't support, or a refused change.
   */
  readonly setEffort: ((level: string) => boolean) | undefined;
  /** Runs one of the `actions` by its `id`. Offered only while `onAction` is set and the menu is enabled. */
  readonly run: ((id: string) => boolean) | undefined;
  /** The trigger's and root's name. */
  name: (state: ModelControlState) => string;
  /** Hands the trigger its props and what it shows. Called by the trigger slot. */
  triggerState: (state: ModelControlState) => ModelControlTriggerState;
};

type ModelControlSlots = Omit<SettingsBaseSlots<ModelControlState, ModelControlApi>, "trigger"> & {
  trigger: SlotDefinition<ModelControlState, ModelControlApi, BaseSlotProps, ModelControlTriggerState>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type ModelControlPrimitive = ReturnType<
  typeof definePrimitive<ModelControlOptions, ModelControlState, ModelControlApi, ModelControlSlots>
>;

const NO_MODELS: ModelOption<unknown>[] = [];
const NO_LEVELS: EffortLevel[] = [];
const NO_ACTIONS: PickerAction<unknown>[] = [];
const NO_SETTINGS: SettingsEntry<unknown>[] = [];

/** The level to land on: `index` when enabled, else the highest enabled one below it, else the lowest. -1 for none. */
const nearestLevel = (options: SettingsOption<unknown>[], index: number) => {
  for (let at = Math.min(index, options.length - 1); at >= 0; at--) if (!options[at]?.disabled) return at;
  return options.findIndex((option) => !option.disabled);
};

const supported = new WeakMap<EffortLevel[], Map<string, SettingsOption<unknown>[]>>();

/** The levels as options, those `efforts` leaves out disabled, kept while both are. */
const levelOptions = (levels: EffortLevel[], efforts: string[] | undefined) => {
  const byEfforts = cached(supported, levels, () => new Map<string, SettingsOption<unknown>[]>());
  const key = efforts ? JSON.stringify(efforts) : "";
  let options = byEfforts.get(key);
  if (!options) {
    options = levels.map(({ value, label }) =>
      efforts && !efforts.includes(value) ? { value, label, disabled: true } : { value, label },
    );
    byEfforts.set(key, options);
  }
  return options;
};

/**
 * The effort level `model` uses for `effort`: itself when the model supports it, else the highest supported level at
 * or below it, else the lowest. An unknown `effort` counts as the middle level. `null` without levels, or for a
 * model that supports none.
 */
export function modelEffort(
  levels: EffortLevel[],
  model: Pick<ModelOption<unknown>, "efforts"> | undefined,
  effort: string | null | undefined,
): string | null {
  const options = levelOptions(levels, model?.efforts);
  const index = options.findIndex((option) => option.value === effort);
  return (
    options[nearestLevel(options, index === -1 ? Math.floor((options.length - 1) / 2) : index)]?.value ?? null
  );
}

const modelOptions = new WeakMap<
  (cost: string) => string,
  WeakMap<ModelOption<unknown>[], SettingsOption<unknown>[]>
>();
const toModelOptions = (models: ModelOption<unknown>[], costName: (cost: string) => string) =>
  cached(
    cached(modelOptions, costName, () => new WeakMap()),
    models,
    () =>
      models.map(({ id, name, icon, group, disabled, cost }) => ({
        value: id,
        label: name,
        ...(icon !== undefined && { icon }),
        ...(group !== undefined && { group }),
        ...(disabled && { disabled }),
        ...(cost && { meta: cost, metaLabel: costName(cost) }),
      })),
  );

const ids = new WeakMap<ModelOption<unknown>[], Map<string, ModelOption<unknown>>>();
const chosenModel = ({ models, model }: Pick<ModelControlState, "models" | "model">) =>
  model === null
    ? undefined
    : cached(ids, models, () => new Map(models.map((each) => [each.id, each]))).get(model);

const reserved = (id: string) => id === MODEL_CONTROL_MODEL || id === MODEL_CONTROL_EFFORT;
const hosts = new WeakMap<SettingsEntry<unknown>[], SettingsEntry<unknown>[]>();
/** The host's settings without any that take Model Control's own ids. */
const hostSettings = (settings: SettingsEntry<unknown>[]) =>
  cached(hosts, settings, () =>
    settings.some((setting) => reserved(setting.id))
      ? settings.filter((setting) => !reserved(setting.id))
      : settings,
  );

const actionValue = (id: string) => `action:${id}`;

const radios = (name: string, options: SettingsOption<unknown>[]) => ({
  type: "radio-group" as const,
  name,
  items: options.map(({ value, label, disabled }) => ({ value, label, ...(disabled && { disabled }) })),
});

/** The rows as UI SDK Menu data, as `getItems` reads them: Model and Effort in the menu itself, then the host's rows. */
const toData = (rows: SettingsMenuRow[], settings: SettingsEntry<unknown>[]): MenuData => {
  const host = settingsData(settings);
  return rows.map((row) => {
    const index = settings.findIndex((setting) => setting.id === row.id);
    if (index !== -1) return host[index] as MenuData[number];
    const choice = row as SettingsMenuChoiceRow;
    return {
      type: "group" as const,
      label: choice.label,
      items: [
        radios(choice.id, choice.options),
        ...choice.actions.map(({ value, label }) => ({ value, label })),
      ],
    };
  });
};

const own = (options: ModelControlOptions) => ({
  models: options.models ?? NO_MODELS,
  levels: options.levels ?? NO_LEVELS,
  actions: typeof options.onAction === "function" ? (options.actions ?? NO_ACTIONS) : NO_ACTIONS,
  modelLabel: options.modelLabel || "Model",
  effortLabel: options.effortLabel || "Effort",
  costNote: costNoteOf(options.costNote, options.models ?? NO_MODELS),
  costName: options.costName ?? defaultCostName,
});

type Context = PrimitiveContext<ModelControlOptions, ModelControlState, string>;

type RowsInput = Pick<
  ModelControlState,
  | "entries"
  | "values"
  | "models"
  | "model"
  | "levels"
  | "effort"
  | "actions"
  | "modelLabel"
  | "effortLabel"
  | "costNote"
  | "costName"
>;

/** The rows: Model and Effort, in the menu itself, then the host's choices and toggles. */
const modelControlRows = (input: RowsInput): SettingsMenuRow[] => {
  const host = settingsMenuRows(hostSettings(input.entries), input.values);
  const chosen = chosenModel(input);
  const efforts = levelOptions(input.levels, chosen?.efforts);
  const actions: SettingsMenuAction[] = input.actions.map(({ id, label, icon }) => ({
    value: actionValue(id),
    label,
    icon,
  }));
  const added: SettingsMenuRow[] = [
    settingsChoiceRow(
      {
        id: MODEL_CONTROL_MODEL,
        label: input.modelLabel,
        options: toModelOptions(input.models, input.costName),
        actions,
        inline: true,
        note: input.costNote,
      },
      input.model,
    ),
  ];
  // A model without effort keeps the section, its levels dimmed, so choosing it doesn't resize the open menu.
  if (efforts.length)
    added.push(
      settingsChoiceRow(
        { id: MODEL_CONTROL_EFFORT, label: input.effortLabel, options: efforts, inline: true },
        modelEffort(input.levels, chosen, input.effort),
      ),
    );
  return [
    ...added,
    ...host.filter((row) => row.type === "choice"),
    ...host.filter((row) => row.type === "toggle"),
  ];
};

const base = settingsBase<ModelControlOptions>({
  kind: "model-control",
  label: "Model",
  // Read from the options, for `getItems`: the rows' shape, which uncontrolled values don't change.
  toData: (options) => {
    const entries = options.settings ?? NO_SETTINGS;
    return toData(
      modelControlRows({
        ...own(options),
        entries,
        values: options.values ?? options.defaultValues ?? {},
        model: options.model ?? options.defaultModel ?? null,
        effort: options.effort ?? options.defaultEffort ?? null,
      }),
      hostSettings(entries),
    );
  },
  rows: () => {
    const rows = memo(
      (
        entries: SettingsEntry<unknown>[],
        values: SettingsBaseState["values"],
        models: ModelOption<unknown>[],
        model: string | null,
        levels: EffortLevel[],
        effort: string | null,
        actions: PickerAction<unknown>[],
        modelLabel: string,
        effortLabel: string,
        costNote: string,
        costName: (cost: string) => string,
      ) =>
        modelControlRows({
          entries,
          values,
          models,
          model,
          levels,
          effort,
          actions,
          modelLabel,
          effortLabel,
          costNote,
          costName,
        }),
    );
    return (state) => {
      const own = state as ModelControlState;
      return rows(
        own.entries,
        own.values,
        own.models,
        own.model,
        own.levels,
        own.effort,
        own.actions,
        own.modelLabel,
        own.effortLabel,
        own.costNote,
        own.costName,
      );
    };
  },
  stored: (id, state) => {
    if (!reserved(id)) return undefined;
    const own = state as ModelControlState;
    return id === MODEL_CONTROL_MODEL ? own.model : own.effort;
  },
  commit: (id, value, { reason, event, source }, context) => {
    if (!reserved(id)) return undefined;
    const change = createChange(context as unknown as Context);
    return change(id, value as string, {
      reason: reason as ModelControlChangeReason,
      ...(event && { event }),
      ...(source && { source }),
    });
  },
  onAction: (value, { event, source, keepOpen }, context) => {
    const action = (context.store.get() as ModelControlState).actions.find(
      (each) => actionValue(each.id) === value,
    );
    if (
      action &&
      dispatch(context, "onAction", action.id, { reason: "item-press", source, ...(event && { event }) })
    )
      keepOpen();
  },
});

/**
 * One button for the model and its effort, reading "GPT-5 · High", that opens one menu: the models, grouped with
 * their icons, then the effort levels the model supports, each one press away, then the host's own choices and
 * toggles.
 */
export const modelControlPrimitive: ModelControlPrimitive = definePrimitive<
  ModelControlOptions,
  ModelControlState,
  ModelControlApi,
  ModelControlSlots
>({
  name: "kind-model-control",
  options: {
    ...base.options,
    models: "value",
    model: "value",
    defaultModel: "value",
    onModelChange: "callback",
    levels: "value",
    effort: "value",
    defaultEffort: "string",
    onEffortChange: "callback",
    actions: "value",
    onAction: "callback",
    modelLabel: "string",
    effortLabel: "string",
    costNote: "string",
    costName: "value",
  },
  state: (options) => {
    const shown = own(options);
    const model = options.model ?? options.defaultModel ?? null;
    const requested = options.effort ?? options.defaultEffort ?? null;
    // Uncontrolled, the effort starts on the level the chosen model uses, so the snapshot and the trigger agree.
    const effort =
      options.effort === undefined
        ? (modelEffort(shown.levels, chosenModel({ models: shown.models, model }), requested) ?? requested)
        : requested;
    return { ...base.state(options), ...shown, model, effort };
  },
  sync: (options) => ({
    ...base.sync(options),
    ...own(options),
    ...(options.model === undefined ? {} : { model: options.model }),
    ...(options.effort === undefined ? {} : { effort: options.effort }),
  }),
  controlled: [...base.controlled, "model", "effort"],
  api: (context) => {
    const { store } = context;
    const api = base.api(
      context as unknown as PrimitiveContext<ModelControlOptions, SettingsBaseState, string>,
    );
    const change = createChange(context);
    const effortOf = (state = store.get()) => modelEffort(state.levels, chosenModel(state), state.effort);
    const choose = (id: string, value: string) => api.setValue?.(id, value) ?? false;

    // A model that doesn't support the effort falls back to the highest level at or below it, and says so.
    let { model, models, levels } = store.get();
    store.subscribe(() => {
      const state = store.get();
      if (state.model === model && state.models === models && state.levels === levels) return;
      ({ model, models, levels } = state);
      const level = effortOf(state);
      if (level !== null && level !== state.effort) change("effort", level, { reason: "model-change" });
    });

    const trigger = memo(
      (
        label: string,
        disabled: boolean,
        modelText: string,
        icon: unknown,
        options: SettingsOption<unknown>[] | undefined,
        value: string | null,
      ): ModelControlTriggerState => ({
        "aria-label": label,
        disabled,
        "data-kind-trigger": "",
        model: { label: modelText, icon },
        effort: options && value !== null ? { options, value } : undefined,
      }),
    );

    const name = (state: ModelControlState) => {
      const chosen = chosenModel(state);
      if (!chosen) return state.label;
      const level = state.levels.find((each) => each.value === effortOf(state));
      // The visible "GPT-5 · High" is a run of the name, as WCAG 2.5.3 asks.
      return level
        ? `${state.label}, ${chosen.name}, ${level.label} ${state.effortLabel.toLocaleLowerCase()}`
        : `${state.label}, ${chosen.name}`;
    };

    const extra: Pick<ModelControlApi, "getModel" | "getEffort" | "name" | "triggerState"> = {
      getModel: () => store.get().model,
      getEffort: () => effortOf(),
      name,
      triggerState: (state) => {
        const chosen = chosenModel(state);
        const level = effortOf(state);
        return trigger(
          name(state),
          state.disabled,
          chosen?.name ?? state.label,
          chosen?.icon,
          level === null ? undefined : levelOptions(state.levels, chosen?.efforts),
          level,
        );
      },
    };
    // `api` has getters (`open`, `toggle`, …), which a spread would read once. Added ones are enumerable, as the
    // agent snapshot reads them.
    Object.defineProperties(api, {
      ...Object.getOwnPropertyDescriptors(extra),
      setModel: {
        enumerable: true,
        get: () => (store.get().disabled ? undefined : (id: string) => choose(MODEL_CONTROL_MODEL, id)),
      },
      setEffort: {
        enumerable: true,
        get: () =>
          store.get().disabled || effortOf() === null
            ? undefined
            : (level: string) => choose(MODEL_CONTROL_EFFORT, level),
      },
      run: {
        enumerable: true,
        get: () => {
          const { actions, disabled } = store.get();
          return disabled || !actions.length
            ? undefined
            : (id: string) =>
                actions.some((action) => action.id === id) &&
                !dispatch(context, "onAction", id, { reason: "imperative" });
        },
      },
    });
    return api as ModelControlApi;
  },
  slots: (slot) => {
    const slots = base.slots(slot);
    return {
      ...slots,
      // A group named as the trigger is, since the agent bridge names a component by its root.
      root: slot({
        ...slots.root,
        attrs: (state, part) => ({ ...slots.root.attrs?.(state, part), "aria-label": part.api.name(state) }),
      }),
      trigger: slot<BaseSlotProps, ModelControlTriggerState>({
        ...slots.trigger,
        state: (state, { api }) => api.triggerState(state),
      }),
    };
  },
  agent: {
    ...base.agent,
    actions: [...base.agent.actions, "setModel", "setEffort", "run"],
    // The bridge checks every action's first argument against one list: row ids, models, levels and actions.
    items: (api: ModelControlApi) =>
      api.getSettings().flatMap((row) => [
        { value: row.id, label: row.label },
        ...(row.type === "choice"
          ? [
              ...row.options.map(({ value, label, disabled }) => ({
                value,
                label,
                disabled: disabled ?? false,
              })),
              ...row.actions.map(({ value, label }) => ({ value: value.slice("action:".length), label })),
            ]
          : []),
      ]),
  },
});
