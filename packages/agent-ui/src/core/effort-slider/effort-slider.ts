import {
  type ChangeDetails,
  type ChangeSource,
  createChange,
  createFocusRecovery,
  createPopup,
  definePrimitive,
  dispatch,
  type PopupContentProps,
  type PopupContentState,
  type PopupState,
  type PopupTriggerProps,
  type PopupTriggerState,
  popupContent,
  popupState,
  popupTitle,
  popupTrigger,
  popupViewport,
  type SlotDefinition,
} from "@ui-sdk/core";
import { type PopoverOpenChangeReason, popoverPreset } from "@ui-sdk/core/popover";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import {
  createSliderController,
  type SliderController,
  type SliderValueChangeReason,
  type SliderValueCommitDetails,
} from "@ui-sdk/core/slider";
import type { EffortLevel } from "../../types/index.js";
import { type ComposedHandler, hearComposed } from "../composed-events.js";
import { memo } from "../memo.js";
import type { MotionMode } from "../motion/index.js";

/**
 * What changed the level: UI SDK Slider's reasons once a drag, a key or a press on the track ends, `"reset-press"`
 * for Reset, and `"imperative"` for an `api` call, like an agent's `setValue` or `reset`.
 */
export type EffortSliderValueChangeReason =
  | Exclude<SliderValueChangeReason, "reset" | "restore">
  | "reset-press";

/** `"sheet"` slides the popup up from the bottom of the screen; `"auto"` does that on small touch screens. */
export type EffortSliderPresentation = "auto" | "popover" | "sheet";

export type EffortSliderOptions = {
  /**
   * The levels, from least to most effort. Empty reads as the default.
   * @default Low, Medium and High
   */
  levels?: EffortLevel[];
  /**
   * The chosen level's `value`. Passing it controls it: change it in `onValueChange`. One that names no level reads
   * as the `defaultLevel`.
   */
  value?: string;
  /**
   * The chosen level's `value` at first, when `value` isn't passed.
   * @default the `defaultLevel`
   */
  defaultValue?: string;
  /**
   * Called when a person settles on a level (a drag reports once, when it ends), or Reset or `setValue` chooses one.
   */
  onValueChange?: (value: string, details: ChangeDetails<EffortSliderValueChangeReason>) => void;
  /**
   * The level Reset returns to, by its `value`.
   * @default the middle level
   */
  defaultLevel?: string;
  /**
   * Names the trigger (with the chosen level's label after it), the popup and the slider.
   * @default "Effort"
   */
  label?: string;
  /** The model the effort is for, which adds a line under the slider: "Effort for GPT-5". */
  modelLabel?: string;
  /** Makes the model line a link to this URL, like the model's settings. */
  modelHref?: string;
  /** Makes the model line a button, called with the `modelLabel` when a person presses it. Ignored with a `modelHref`. */
  onModelPress?: (model: string, details: ChangeDetails<"model-press">) => void;
  /** Whether the popup is open. Passing it controls it: change it in `onOpenChange`. */
  open?: boolean;
  /**
   * Whether the popup is open at first, when `open` isn't passed.
   * @default false
   */
  defaultOpen?: boolean;
  /** Called when the popup opens or closes, with what caused it. */
  onOpenChange?: (open: boolean, details: ChangeDetails<PopoverOpenChangeReason>) => void;
  /**
   * How the popup presents. `"auto"` is a bottom sheet on small touch screens and a popover elsewhere.
   * @default "auto"
   */
  presentation?: EffortSliderPresentation;
  /**
   * Whether the trigger can't open the popup.
   * @default false
   */
  disabled?: boolean;
  /**
   * How the popup opens and closes, and whether the thumb squishes, bumps on each level and glows at the last.
   * `"auto"` follows `prefers-reduced-motion`; reduced motion only fades the popup.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type EffortSliderState = PopupState & {
  /** The `levels`, else Low, Medium and High. */
  levels: EffortLevel[];
  /** The chosen level's `value`. */
  value: string;
  /** The `defaultLevel`, else the middle level's `value`. */
  defaultLevel: string;
  /** The `label`, else "Effort". */
  label: string;
  /** The `modelLabel`, `undefined` when empty. */
  modelLabel: string | undefined;
  /** The `modelHref`, `undefined` when empty. */
  modelHref: string | undefined;
  /** Whether `onModelPress` is set. */
  canPressModel: boolean;
  /** The `disabled` option. */
  disabled: boolean;
  /** The `motion` option. */
  motion: MotionMode;
  /** The level the Slider shows now, by index: it follows a drag or a key before the level is reported. */
  live: number;
  /** How many times `live` changed, which replays the snap on each change. */
  ticks: number;
};

/** What the trigger shows: every level's label, so it keeps the widest one's width, and which one is chosen. */
export type EffortSliderTriggerState = PopupTriggerState & {
  /** Every level, in order: render each label in one cell. */
  levels: EffortLevel[];
  /** The chosen level's index in `levels`. */
  index: number;
  /** Whether the chosen level is the last. */
  top: boolean;
};

/** What the `slider` part hands UI SDK Slider: pass `props` to it and `thumbLabel` to its thumb as `aria-label`. */
export type EffortSliderSliderState = {
  props: {
    /** The primitive's own, which it writes the chosen level through. */
    controller: SliderController<number>;
    /** The chosen level's index when the Slider mounted. */
    defaultValue: number;
    /** The first level's index. */
    min: 0;
    /** The last level's index. */
    max: number;
    /** One level per step. */
    step: 1;
    /** Reads each index as its level's label, for `aria-valuetext` and the Slider's value part. */
    format: (index: number) => string;
    disabled: boolean;
    /** Follows the level the Slider shows, before it's reported. */
    onValueChange: (index: number) => void;
    /** Reports the level a person settled on. */
    onValueCommit: (index: number, details: SliderValueCommitDetails) => void;
  };
  /** Names the thumb: the `label`. */
  thumbLabel: string;
};

/** A level's tick and label under the track. */
export type EffortSliderStop = {
  /** The level's `value`. */
  value: string;
  /** The level's `label`, shown under its tick. */
  label: string;
  /** Where it sits along the track, from 0 to 1. */
  position: number;
  /** Whether it's the chosen level. */
  current: boolean;
  /** Whether it's the last level. */
  top: boolean;
};

/** What the `model` part shows, and whether it's a link (`href`), a button (`pressable`) or text. */
export type EffortSliderModelState = {
  /** "<label> for <modelLabel>", like "Effort for GPT-5". */
  text: string;
  /** The `modelHref`: render the text as a link to it. */
  href: string | undefined;
  /** Whether `onModelPress` is set and there's no `href`: render the text as a button. */
  pressable: boolean;
};

type Popup = ReturnType<typeof createPopup<EffortSliderOptions, EffortSliderState, typeof popoverPreset>>;

export type EffortSliderApi = Omit<Popup, "open" | "close"> & {
  /** Opens the popup. Offered only while it's closed and enabled. Returns whether the change was accepted. */
  readonly open: (() => boolean) | undefined;
  /** Closes the popup. Offered only while it's open. Returns whether the change was accepted. */
  readonly close: (() => boolean) | undefined;
  /** The chosen level's `value`. */
  getValue: () => string;
  /**
   * Chooses a level by its `value`, as a person would. Returns `false` for an unknown level or a refused change.
   * Offered only while enabled.
   */
  readonly setValue: ((value: string) => boolean) | undefined;
  /** Returns to the `defaultLevel`, as Reset does. Offered only while enabled and another level is chosen. */
  readonly reset: (() => boolean) | undefined;
  /** The `levels`. */
  getLevels: () => EffortLevel[];
  /** The trigger's and root's name: the `label`, and the chosen level's after it. */
  name: (state: EffortSliderState) => string;
  /** Hands the trigger every label and the chosen one. Called by the trigger slot. */
  triggerState: (state: EffortSliderState) => Omit<EffortSliderTriggerState, keyof PopupTriggerState>;
  /** Hands UI SDK Slider its props. Called by the slider slot. */
  sliderState: (state: EffortSliderState) => EffortSliderSliderState;
  /** Hands the stops their ticks and labels. Called by the stops slot. */
  stopsState: (state: EffortSliderState) => { stops: EffortSliderStop[] };
  /** Hands the model line its text and kind. Called by the model slot. */
  modelState: (state: EffortSliderState) => EffortSliderModelState;
  /** Writes the chosen level into the Slider once it has attached the controller. */
  syncValue: () => void;
  /** Returns to the `defaultLevel`, from Reset. */
  pressReset: (event?: Event) => void;
  /** Reports a press on the model line's button. */
  pressModel: (event: Event) => void;
  /** UI SDK Slider's `valuecommit` on Web Components, heard by the slider slot through `hearComposed`. */
  composedEvents: Record<string, ComposedHandler>;
  /** Moves focus to the thumb when Reset leaves while focused. */
  resetRecovery: ReturnType<typeof createFocusRecovery>;
};

type Slot<
  Props extends object = BaseSlotProps,
  Public extends object = Record<never, never>,
> = SlotDefinition<EffortSliderState, EffortSliderApi, Props, Public>;

type EffortSliderSlots = {
  root: Slot;
  trigger: Slot<PopupTriggerProps & BaseSlotProps, EffortSliderTriggerState>;
  content: Slot<PopupContentProps & BaseSlotProps, PopupContentState>;
  viewport: Slot;
  title: Slot<BaseSlotProps, { label: string }>;
  slider: Slot<BaseSlotProps, EffortSliderSliderState>;
  stops: Slot<BaseSlotProps, { stops: EffortSliderStop[] }>;
  reset: Slot;
  model: Slot<BaseSlotProps, EffortSliderModelState>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type EffortSliderPrimitive = ReturnType<
  typeof definePrimitive<EffortSliderOptions, EffortSliderState, EffortSliderApi, EffortSliderSlots>
>;

const defaultLevels: EffortLevel[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

/** The thumb's range input, which takes focus as the popup opens. */
export const EFFORT_SLIDER_THUMB = '[data-slot="slider-thumb"] input';

const presentation = (options: EffortSliderOptions) => {
  const levels = options.levels?.length ? options.levels : defaultLevels;
  const middle = levels[Math.floor((levels.length - 1) / 2)] as EffortLevel;
  return {
    levels,
    defaultLevel:
      options.defaultLevel !== undefined && levels.some((level) => level.value === options.defaultLevel)
        ? options.defaultLevel
        : middle.value,
    label: options.label || "Effort",
    modelLabel: options.modelLabel || undefined,
    modelHref: options.modelHref || undefined,
    canPressModel: typeof options.onModelPress === "function",
    disabled: options.disabled ?? false,
    motion: options.motion ?? "auto",
  };
};

/** A value that names no level reads as the `defaultLevel`, so the snapshot, the trigger and Reset agree. */
const known = (
  { levels, defaultLevel }: Pick<EffortSliderState, "levels" | "defaultLevel">,
  value: string | undefined,
) => (value !== undefined && levels.some((level) => level.value === value) ? value : defaultLevel);

const indexOf = ({ levels, value }: EffortSliderState) => levels.findIndex((level) => level.value === value);

/** `--kind-effort-slider-level`: how far a level sits along the levels, from 0 to 1, which the styles warm up with. */
const levelStyle = (levels: EffortLevel[], index: number) =>
  `--kind-effort-slider-level: ${levels.length > 1 ? Math.max(index, 0) / (levels.length - 1) : 1}`;

const offersReset = (state: EffortSliderState) => !state.disabled && state.value !== state.defaultLevel;

export const effortSliderPrimitive: EffortSliderPrimitive = definePrimitive<
  EffortSliderOptions,
  EffortSliderState,
  EffortSliderApi,
  EffortSliderSlots
>({
  name: "kind-effort-slider",
  options: {
    levels: "value",
    value: "string",
    defaultValue: "string",
    onValueChange: "callback",
    defaultLevel: "string",
    label: "string",
    modelLabel: "string",
    modelHref: "string",
    onModelPress: "callback",
    open: "boolean",
    defaultOpen: "boolean",
    onOpenChange: "callback",
    presentation: "string",
    disabled: "boolean",
    motion: "string",
  },
  state: (options) => {
    const shown = presentation(options);
    const value = known(shown, options.value ?? options.defaultValue);
    const live = shown.levels.findIndex((level) => level.value === value);
    return { ...popupState(options), ...shown, value, live, ticks: 0 };
  },
  sync: (options) => {
    const shown = presentation(options);
    return {
      ...shown,
      ...(options.open === undefined ? {} : { open: options.open }),
      ...(options.value === undefined ? {} : { value: known(shown, options.value) }),
    };
  },
  controlled: ["open", "value"],
  api: (context) => {
    const { store } = context;
    // `createPopup` presents as a popover unless the options say otherwise. A prototype rather than a spread, because
    // on Web Components `@ui-sdk/web` fills in the callbacks on read.
    const popup = createPopup<EffortSliderOptions, EffortSliderState, typeof popoverPreset>(
      {
        ...context,
        options: () => {
          const options = context.options();
          return options.presentation ? options : Object.create(options, { presentation: { value: "auto" } });
        },
      },
      { preset: popoverPreset },
    );
    const change = createChange(context);
    const controller = createSliderController<number>();
    let resync = 0;
    context.onDestroy(() => {
      if (resync) cancelAnimationFrame(resync);
    });
    // A host that drops the chosen level from `levels` leaves an uncontrolled slider on the `defaultLevel`.
    // Listeners run before the store takes the new options, so the levels are read from them.
    context.onOptions((options) => {
      const shown = presentation(options);
      const { value } = store.get();
      if (options.value === undefined && known(shown, value) !== value)
        store.set({ value: shown.defaultLevel });
    });

    const syncValue = () => {
      // The controller reads `undefined` until a Slider attaches it.
      const shown = controller.getValue() as number | undefined;
      const index = indexOf(store.get());
      if (shown !== undefined && shown !== index) controller.setValue(index);
    };
    store.subscribe(syncValue);
    // A level chosen anywhere but the Slider (a host, an agent, Reset) moves what it shows too.
    let committed = store.get().value;
    // Each opening starts without a snap, so the bump and the glow play only for a level reached while it's open.
    let wasOpen = store.get().open;
    store.subscribe(() => {
      const state = store.get();
      if (state.open !== wasOpen) {
        wasOpen = state.open;
        if (state.open && state.ticks) store.set({ ticks: 0 });
      }
      if (state.value === committed) return;
      committed = state.value;
      const index = indexOf(state);
      if (index !== state.live) store.set({ live: index });
    });
    const follow = (index: number) => {
      const { live, ticks } = store.get();
      if (index !== live) store.set({ live: index, ticks: ticks + 1 });
    };

    const choose = (
      value: string,
      details: { reason: EffortSliderValueChangeReason; event?: Event; source?: ChangeSource },
    ) => {
      const state = store.get();
      if (state.disabled || !state.levels.some((level) => level.value === value)) return false;
      if (value === state.value) return true;
      const taken = change("value", value, details);
      // A change the owner cancels is written back, and so is one a controlling owner didn't take by the next frame:
      // the Slider holds its own value.
      if (!taken) syncValue();
      else if (context.options().value !== undefined) {
        cancelAnimationFrame(resync);
        resync = requestAnimationFrame(syncValue);
      }
      return taken;
    };

    const commit = (index: number, { reason, event, source }: SliderValueCommitDetails) => {
      const level = store.get().levels[index];
      if (level && reason !== "reset" && reason !== "restore")
        choose(level.value, event ? { reason, event, source } : { reason, source });
    };

    const triggerState = memo((levels: EffortLevel[], index: number) => ({
      levels,
      index,
      top: index === levels.length - 1,
    }));

    // The Slider takes `defaultValue` as it mounts, which React does each time the popup opens.
    const sliderState = memo(
      (levels: EffortLevel[], index: number, disabled: boolean, label: string): EffortSliderSliderState => ({
        props: {
          controller,
          defaultValue: index,
          min: 0,
          max: levels.length - 1,
          step: 1,
          format: (at) => levels[at]?.label ?? "",
          disabled,
          onValueChange: follow,
          onValueCommit: commit,
        },
        thumbLabel: label,
      }),
    );

    const stopsState = memo((levels: EffortLevel[], index: number) => ({
      stops: levels.map((level, at) => ({
        value: level.value,
        label: level.label,
        position: levels.length > 1 ? at / (levels.length - 1) : 0,
        current: at === index,
        top: at === levels.length - 1,
      })),
    }));

    const modelState = memo(
      (
        label: string,
        model: string,
        href: string | undefined,
        canPress: boolean,
      ): EffortSliderModelState => ({
        text: `${label} for ${model}`,
        href,
        pressable: !href && canPress,
      }),
    );

    return {
      ...popup,
      get open() {
        const { open, disabled } = store.get();
        return open || disabled ? undefined : () => popup.setOpen(true);
      },
      get close() {
        return store.get().open ? () => popup.setOpen(false) : undefined;
      },
      getValue: () => store.get().value,
      get setValue() {
        return store.get().disabled ? undefined : (value: string) => choose(value, { reason: "imperative" });
      },
      get reset() {
        return offersReset(store.get())
          ? () => choose(store.get().defaultLevel, { reason: "imperative" })
          : undefined;
      },
      getLevels: () => store.get().levels,
      name: (state) => {
        const level = state.levels[indexOf(state)];
        return level ? `${state.label}, ${level.label}` : state.label;
      },
      triggerState: (state) => triggerState(state.levels, indexOf(state)),
      sliderState: (state) => sliderState(state.levels, indexOf(state), state.disabled, state.label),
      stopsState: (state) => stopsState(state.levels, state.live),
      modelState: (state) =>
        modelState(state.label, state.modelLabel ?? "", state.modelHref, state.canPressModel),
      syncValue,
      pressReset: (event) => {
        if (offersReset(store.get()))
          choose(
            store.get().defaultLevel,
            event ? { reason: "reset-press", event } : { reason: "reset-press" },
          );
      },
      pressModel: (event) => {
        const { modelLabel, modelHref, canPressModel } = store.get();
        // The line is a button only without a link; a press beside the button is a press on text.
        if (!modelHref && canPressModel && (event.target as Element | null)?.closest("button"))
          dispatch(context, "onModelPress", modelLabel, { reason: "model-press", event });
      },
      composedEvents: {
        valuechange: (detail, event) => {
          if ((event.target as Element).localName === "ui-slider")
            follow((detail as { value: number }).value);
        },
        valuecommit: (detail, event) => {
          if ((event.target as Element).localName !== "ui-slider") return;
          const { value, ...details } = detail as { value: number } & SliderValueCommitDetails;
          commit(value, details);
        },
      },
      resetRecovery: createFocusRecovery({
        fallback: () => context.element("slider")?.querySelector<HTMLElement>(EFFORT_SLIDER_THUMB) ?? null,
      }),
    };
  },
  slots: (slot) => {
    const trigger = popupTrigger(slot);
    const content = popupContent(slot);
    const title = popupTitle(slot);
    return {
      root: slot({
        role: "group",
        attrs: (state, { api }) => ({
          "aria-label": api.name(state),
          "data-effort-slider-part": "root",
          "data-open": state.open ? "" : undefined,
          "data-disabled": state.disabled ? "" : undefined,
          "data-motion": state.motion,
        }),
      }),
      trigger: slot<PopupTriggerProps & BaseSlotProps, EffortSliderTriggerState>({
        ...trigger,
        state: (state, part) => ({
          ...(trigger.state?.(state, part) as PopupTriggerState),
          ...part.api.triggerState(state),
        }),
        attrs: (state, part) => ({
          ...trigger.attrs?.(state, part),
          type: "button",
          "aria-label": part.api.name(state),
          "data-effort-slider-part": "trigger",
          "data-top": part.api.triggerState(state).top ? "" : undefined,
          style: levelStyle(state.levels, indexOf(state)),
        }),
      }),
      content: slot<PopupContentProps & BaseSlotProps, PopupContentState>({
        ...content,
        attrs: (state, part) => ({
          ...content.attrs?.(state, part),
          "data-effort-slider-part": "content",
          "data-motion": state.motion,
        }),
      }),
      // The full-screen element the content sits in while it presents as a sheet: render it around the content then.
      viewport: popupViewport(slot),
      title: slot<BaseSlotProps, { label: string }>({
        ...title,
        state: (state) => ({ label: state.label }),
        attrs: (state, part) => ({ ...title.attrs?.(state, part), "data-effort-slider-part": "title" }),
      }),
      slider: slot<BaseSlotProps, EffortSliderSliderState>({
        state: (state, { api }) => api.sliderState(state),
        // `data-tick` flips with each level the Slider lands on, so the styles replay the snap.
        attrs: (state) => ({
          "data-effort-slider-part": "slider",
          "data-top": state.live === state.levels.length - 1 ? "" : undefined,
          "data-tick": state.ticks ? String(state.ticks % 2) : undefined,
          style: levelStyle(state.levels, state.live),
        }),
        bind: (el, { api }) => {
          api.syncValue();
          return hearComposed(el, api.composedEvents);
        },
      }),
      stops: slot<BaseSlotProps, { stops: EffortSliderStop[] }>({
        state: (state, { api }) => api.stopsState(state),
        attrs: () => ({ "aria-hidden": "true", "data-effort-slider-part": "stops" }),
      }),
      reset: slot({
        role: "button",
        focus: "native",
        present: offersReset,
        press: ({ api }, event) => api.pressReset(event),
        attrs: () => ({ type: "button", "data-effort-slider-part": "reset" }),
        bind: (el, part) => part.api.resetRecovery.bind(el, part),
      }),
      model: slot<BaseSlotProps, EffortSliderModelState>({
        present: (state) => state.modelLabel !== undefined,
        state: (state, { api }) => api.modelState(state),
        attrs: () => ({ "data-effort-slider-part": "model" }),
        on: { click: (event, { api }) => api.pressModel(event) },
      }),
    };
  },
  agent: {
    actions: ["open", "close", "setValue", "reset"],
    items: (api: EffortSliderApi) =>
      api.getLevels().map((level) => ({ value: level.value, label: level.label })),
    closed: true,
  },
});
