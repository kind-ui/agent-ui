import { type ChangeDetails, createChange, definePrimitive, type SlotDefinition } from "@ui-sdk/core";
import { type ComboboxController, createComboboxController } from "@ui-sdk/core/combobox";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { type MatchSegment, matchRanges, matchSegments } from "@ui-sdk/core/text-match";
import type { ModelOption } from "../../types/index.js";
import { memo } from "../memo.js";
import type { MotionMode } from "../motion/index.js";
import { filterModels } from "./filter.js";

/** `"input-change"`: a person chose a model in the list. `"imperative"`: an `api` call, like an agent's `setValue`. */
export type ModelSelectorValueChangeReason = "input-change" | "imperative";

export type ModelSelectorOptions = {
  /**
   * The models to choose from, grouped by their `group` in the order groups first appear.
   * @default []
   */
  models?: ModelOption[];
  /** The chosen model's id. Passing it controls it: change it in `onValueChange`. */
  value?: string | null;
  /**
   * The chosen model's id at first, when `value` isn't passed.
   * @default null
   */
  defaultValue?: string | null;
  /** Called when a person or `setValue` chooses a model, with why. */
  onValueChange?: (value: string | null, details: ChangeDetails<ModelSelectorValueChangeReason>) => void;
  /**
   * Names the picker and its search field.
   * @default "Model"
   */
  label?: string;
  /**
   * Shown in the search field while no model is chosen.
   * @default "Search models"
   */
  placeholder?: string;
  /**
   * Names the button that opens the list.
   * @default "Show models"
   */
  openLabel?: string;
  /**
   * Whether the picker can't be focused or changed.
   * @default false
   */
  disabled?: boolean;
  /**
   * How the list opens and closes. `"auto"` follows `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type ModelSelectorState = {
  /** The `models`. */
  models: ModelOption[];
  /** The chosen model's id. */
  value: string | null;
  /** The `label`, else "Model". */
  label: string;
  /** The `placeholder`, else "Search models". */
  placeholder: string;
  /** The `openLabel`, else "Show models". */
  openLabel: string;
  /** The `disabled` option. */
  disabled: boolean;
  /** The `motion` option. */
  motion: MotionMode;
  /** What a person typed since the list opened. */
  query: string;
  /** Whether the list is open. */
  open: boolean;
};

/** What the root hands the Combobox: pass every key to it. */
export type ModelSelectorComboboxState = {
  /** The primitive's own, which it reads and writes the chosen model through. */
  controller: ComboboxController;
  /** The chosen model when the Combobox mounted. */
  defaultValue: string | null;
  /** A model's name from its id, for a chosen model the filter hides. */
  itemToLabel: (id: string) => string;
  /** The primitive filters and ranks the list itself. */
  filter: false;
  /** Highlights the best match as a person types, so Enter chooses it. */
  autoHighlight: true;
  /** The `disabled` option. */
  disabled: boolean;
};

/** A model as the list shows it: its name split into what the query matched and what it didn't. */
export type ModelSelectorItem = ModelOption & { segments: MatchSegment[] };

/** What the content renders: the matching models by group, best match first. */
export type ModelSelectorContentState = {
  /** The groups with a match, in the order they first appear, each with its matching models, best first. */
  groups: { group: string | undefined; models: ModelSelectorItem[] }[];
};

export type ModelSelectorApi = {
  /** The chosen model's id. */
  getValue: () => string | null;
  /** Chooses a model, as a person would. Returns `false` for an unknown or disabled model, or a refused change. */
  setValue: (id: string) => boolean;
  /** The `models`. */
  getModels: () => ModelOption[];
  /** Reports the model a person chose. Called as the Combobox's `change` bubbles to the root. */
  read: (event: Event) => void;
  /** Filters the list by what a person typed. Called as the search field's `input` bubbles. */
  search: () => void;
  /** Follows the list the Combobox opened, so the query resets when it closes. Called as keys and presses bubble. */
  follow: () => void;
  /** Writes the chosen model into the Combobox once it has attached the controller. */
  syncValue: () => void;
  /** Hands the Combobox its props. Called by the root slot. */
  comboboxState: (state: ModelSelectorState) => ModelSelectorComboboxState;
  /** Hands the content the matching models. Called by the content slot. */
  contentState: (state: ModelSelectorState) => ModelSelectorContentState;
};

type Slot<Public extends object = Record<never, never>> = SlotDefinition<
  ModelSelectorState,
  ModelSelectorApi,
  BaseSlotProps,
  Public
>;

type ModelSelectorSlots = {
  root: Slot<ModelSelectorComboboxState>;
  trigger: Slot<{ group: string; buttonLabel: string }>;
  input: Slot<{ label: string; placeholder: string }>;
  content: Slot<ModelSelectorContentState>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type ModelSelectorPrimitive = ReturnType<
  typeof definePrimitive<ModelSelectorOptions, ModelSelectorState, ModelSelectorApi, ModelSelectorSlots>
>;

const noModels: ModelOption[] = [];

const presentation = (options: ModelSelectorOptions) => ({
  models: options.models ?? noModels,
  label: options.label ?? "Model",
  placeholder: options.placeholder ?? "Search models",
  openLabel: options.openLabel ?? "Show models",
  disabled: options.disabled ?? false,
  motion: options.motion ?? "auto",
});

const modelOf = (state: ModelSelectorState, id: string | null) =>
  state.models.find((model) => model.id === id);

export const modelSelectorPrimitive: ModelSelectorPrimitive = definePrimitive<
  ModelSelectorOptions,
  ModelSelectorState,
  ModelSelectorApi,
  ModelSelectorSlots
>({
  name: "kind-model-selector",
  options: {
    models: "value",
    value: "value",
    defaultValue: "value",
    onValueChange: "callback",
    label: "string",
    placeholder: "string",
    openLabel: "string",
    disabled: "boolean",
    motion: "string",
  },
  state: (options) => ({
    ...presentation(options),
    value: options.value ?? options.defaultValue ?? null,
    query: "",
    open: false,
  }),
  sync: (options) => ({
    ...presentation(options),
    ...(options.value === undefined ? {} : { value: options.value }),
  }),
  controlled: ["value"],
  api: (context) => {
    const { store } = context;
    const change = createChange(context);
    const controller = createComboboxController();
    const initial = store.get().value;
    let watching = false;
    let destroyed = false;
    let resync = 0;
    context.onDestroy(() => {
      destroyed = true;
      cancelAnimationFrame(resync);
    });

    const syncValue = () => {
      const { value } = store.get();
      // The controller reads `undefined` until the Combobox attaches it.
      const shown = controller.getValue();
      if (shown !== undefined && shown !== value) controller.setValue(value);
    };
    store.subscribe(syncValue);

    const itemToLabel = (id: string) => modelOf(store.get(), id)?.name ?? id;
    const comboboxState = memo(
      (disabled: boolean): ModelSelectorComboboxState => ({
        controller,
        defaultValue: initial,
        itemToLabel,
        filter: false,
        autoHighlight: true,
        disabled,
      }),
    );
    const contentState = memo(
      (models: ModelOption[], query: string): ModelSelectorContentState => ({
        groups: filterModels(models, query).map(({ group, models: matched }) => ({
          group,
          models: matched.map((model) => ({
            ...model,
            segments: matchSegments(model.name, matchRanges(model.name, query, "fuzzy")),
          })),
        })),
      }),
    );

    return {
      getValue: () => store.get().value,
      setValue: (id) => {
        const state = store.get();
        const model = modelOf(state, id);
        if (!model || model.disabled || state.disabled) return false;
        return id === state.value || change("value", id, { reason: "imperative" });
      },
      getModels: () => store.get().models,
      read: (event) => {
        const next = controller.getValue() ?? null;
        if (next === store.get().value) return;
        // A change the owner cancels is written back, and so is one a controlling owner didn't take by the next
        // frame: the Combobox holds its own value.
        if (!change("value", next, { reason: "input-change", event })) syncValue();
        else if (context.options().value !== undefined) {
          cancelAnimationFrame(resync);
          resync = requestAnimationFrame(syncValue);
        }
      },
      search: () => {
        if (controller.isOpen()) store.set({ query: controller.getQuery() });
      },
      // `open` resolves on the list's next close, whatever causes it, and the Combobox puts the chosen name back.
      follow: () => {
        if (watching || !controller.isOpen()) return;
        watching = true;
        store.set({ open: true });
        void controller.open().then(() => {
          watching = false;
          if (!destroyed) store.set({ open: false, query: "" });
        });
      },
      syncValue,
      comboboxState: (state) => comboboxState(state.disabled),
      contentState: (state) => contentState(state.models, state.query),
    };
  },
  slots: (slot) => ({
    root: slot<BaseSlotProps, ModelSelectorComboboxState>({
      role: "group",
      state: (state, { api }) => api.comboboxState(state),
      attrs: (state) => ({
        "aria-label": state.label,
        "data-open": state.open ? "" : undefined,
        "data-disabled": state.disabled ? "" : undefined,
        "data-motion": state.motion,
      }),
      // UI SDK's Combobox fires a native `change` that bubbles, as a native select does.
      on: { change: (event, { api }) => api.read(event) },
      bind: (_el, { api }) => api.syncValue(),
    }),
    trigger: slot<BaseSlotProps, { group: string; buttonLabel: string }>({
      state: (state) => ({
        group: modelOf(state, state.value)?.group ?? "",
        buttonLabel: state.openLabel,
      }),
      on: {
        keydown: (_event, { api }) => api.follow(),
        click: (_event, { api }) => api.follow(),
      },
    }),
    input: slot<BaseSlotProps, { label: string; placeholder: string }>({
      state: (state) => ({ label: state.label, placeholder: state.placeholder }),
      on: {
        input: (_event, { api }) => {
          api.follow();
          api.search();
        },
      },
    }),
    content: slot<BaseSlotProps, ModelSelectorContentState>({
      state: (state, { api }) => api.contentState(state),
    }),
  }),
  // Models are listed by name, so an agent can name one to `setValue`; an unknown or disabled one is refused.
  agent: {
    actions: ["setValue"],
    items: (api: ModelSelectorApi) =>
      api.getModels().map(({ id, name, disabled }) => ({ value: id, label: name, disabled })),
    closed: true,
  },
});
