import {
  type ChangeDetails,
  createPopup,
  type PopupPreset,
  type PopupState,
  type PrimitiveContext,
  pageLocale,
  popupContent,
  popupDescription,
  popupState,
  popupTitle,
  popupTrigger,
  type SlotFactory,
  toLocale,
} from "@ui-sdk/core";
import type { PopoverOpenChangeReason } from "@ui-sdk/core/popover";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { hoverPopupPreset, withHover } from "./hover-popup.js";
import { memo } from "./memo.js";
import type { MotionMode } from "./motion/index.js";

/** Why a meter's details opened or closed: UI SDK Popover's reasons, and `"trigger-focus"` for keyboard focus. */
export type MeterOpenChangeReason = PopoverOpenChangeReason | "trigger-focus";

export type MeterBaseOptions = {
  /**
   * The locale numbers are formatted in, like `"de-DE"`. Defaults to the page's `lang`, or the browser's language
   * without one, once the meter is in the page; server markup uses English until then.
   */
  locale?: string;
  /** Names the meter. */
  label?: string;
  /** Whether the details are open. Passing it controls them: change it in `onOpenChange`. */
  open?: boolean;
  /**
   * Whether the details are open at first, when `open` isn't passed.
   * @default false
   */
  defaultOpen?: boolean;
  /** Called when the details open or close, with what caused it. */
  onOpenChange?: (open: boolean, details: ChangeDetails<MeterOpenChangeReason>) => void;
  /**
   * How the ring fills and the details open: at full motion the ring sweeps and the details rise in; reduced motion
   * only fades. `"auto"` follows `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type MeterBaseState = PopupState & {
  /** The `label`, else the meter's own name. */
  label: string;
  /** How full the meter is, written as `data-level`. */
  level: string;
  /** The `locale` option, when it's a valid tag. */
  locale: string | undefined;
  /** The page's language where the meter is, read once it's in the page. Null on the server. */
  pageLocale: string | null;
  /** The `motion` option. */
  motion: MotionMode;
};

/** The props the value part hands UI SDK's Meter. */
export type MeterValueState = {
  /** Pass it to the Meter as its `value`. */
  value: number;
  /** Pass it to the Meter as its `max`. */
  max: number;
  /** Pass it to the Meter. */
  locale: string;
  /** Pass it to the Meter as its `aria-label`. */
  label: string;
  /** Pass it to the Meter, so screen readers hear the amounts as well as the percentage. */
  getValueLabel: () => string;
};

type Popup = ReturnType<typeof createPopup<MeterBaseOptions, MeterBaseState, PopupPreset>>;

export type MeterBaseApi<State extends MeterBaseState> = Omit<Popup, "open" | "close"> & {
  /** Opens the details. Offered only while they're closed. Returns whether the change was accepted. */
  readonly open: (() => boolean) | undefined;
  /** Closes the details. Offered only while they're open. Returns whether the change was accepted. */
  readonly close: (() => boolean) | undefined;
  /** What screen readers hear for the value, like "57,600 of 128,000 tokens, 45%". */
  valueText: (state: State) => string;
  /** The details' description, like "57,600 of 128,000 tokens": the button already shows the percentage. */
  countText: (state: State) => string;
  /** Hands the Meter its props. Called by the value slot. */
  valueState: (state: State) => MeterValueState;
};

export type MeterBaseConfig<State extends MeterBaseState> = {
  /** The `label` when the host passes none. */
  label: string;
  /** The amount used and the most there can be, which the Meter shows. */
  amount: (state: State) => { value: number; max: number };
  /** The value for screen readers, in `locale`. */
  valueText: (state: State, locale: string) => string;
  /** The details' description, in `locale`. */
  countText: (state: State, locale: string) => string;
  /** The state keys `valueText` and `countText` read, so their words are reused while those keys hold. */
  keys: readonly (keyof State)[];
};

/**
 * A meter whose trigger is a ring around its percentage and whose details open in a popover on press, hover or
 * keyboard focus (spec §3.2): its options, state, api, slots and agent actions, which Context Meter and Usage Meter
 * spread into their own `definePrimitive`, adding their amounts to `state` and `sync`, and their methods to the api
 * through `Object.assign`: a spread would read its `open` and `close` getters once.
 */
export const meterBase = <
  Options extends MeterBaseOptions,
  State extends MeterBaseState,
  Api extends MeterBaseApi<State> = MeterBaseApi<State>,
>(
  config: MeterBaseConfig<State>,
) => {
  const presentation = (options: Options) => ({
    label: options.label ?? config.label,
    locale: toLocale(options.locale),
    motion: options.motion ?? "auto",
  });
  // Server markup is English, as UI SDK Meter's is, so it never disagrees with the client's.
  const localeOf = (state: State) => state.locale ?? state.pageLocale ?? "en-US";
  return {
    options: {
      locale: "string",
      label: "string",
      open: "boolean",
      defaultOpen: "boolean",
      onOpenChange: "callback",
      motion: "string",
    } as const,
    state: (options: Options) => ({ ...popupState(options), ...presentation(options), pageLocale: null }),
    // Typed on `State`, so a component's own `sync` can spread it.
    sync: (options: Options) =>
      ({
        ...presentation(options),
        ...(options.open === undefined ? {} : { open: options.open }),
      }) as Partial<State>,
    controlled: ["open"] as "open"[],
    /** The locale numbers are formatted in: the `locale`, else the page's, else English. */
    localeOf,
    api: (context: PrimitiveContext<Options, State, string>): MeterBaseApi<State> => {
      // `createPopup` reads open change reasons from the options type, which a generic `Options` hides.
      const base = context as unknown as PrimitiveContext<MeterBaseOptions, MeterBaseState, string>;
      const popup: Popup = createPopup(
        { ...base, options: () => withHover(base.options()) },
        { preset: hoverPopupPreset },
      );
      const { store } = context;
      const words = (text: MeterBaseConfig<State>["valueText"]) => {
        let current: State;
        const build = memo((locale: string, ..._keys: unknown[]) => text(current, locale));
        return (state: State) => {
          current = state;
          return build(localeOf(state), ...config.keys.map((key) => state[key]));
        };
      };
      const valueText = words(config.valueText);
      const countText = words(config.countText);
      const valueState = memo(
        (value: number, max: number, locale: string, label: string, valueText: string) => ({
          value,
          max,
          locale,
          label,
          getValueLabel: () => valueText,
        }),
      );
      return {
        ...popup,
        get open() {
          return store.get().open ? undefined : () => popup.setOpen(true);
        },
        get close() {
          return store.get().open ? () => popup.setOpen(false) : undefined;
        },
        valueText,
        countText,
        valueState: (state) => {
          const { value, max } = config.amount(state);
          return valueState(value, max, localeOf(state), state.label, valueText(state));
        },
      };
    },
    slots: (slot: SlotFactory<State, Api>) => {
      const trigger = popupTrigger(slot);
      const content = popupContent(slot);
      return {
        root: slot({
          role: "group",
          attrs: (state) => ({
            "aria-label": state.label,
            "data-level": state.level,
            "data-motion": state.motion,
          }),
          bind: (el, { store }) => {
            store.set({ pageLocale: pageLocale(el) ?? null } as Partial<State>);
          },
        }),
        // Named by its value, since the meter inside a button isn't read on its own.
        trigger: slot({
          ...trigger,
          attrs: (state, part) => ({
            ...trigger.attrs?.(state, part),
            type: "button",
            "aria-label": part.api.valueText(state),
            "data-kind-trigger": "",
            "data-kind-size": "sm",
          }),
        }),
        value: slot<BaseSlotProps, MeterValueState>({
          state: (state, { api }) => api.valueState(state),
        }),
        content: slot({
          ...content,
          attrs: (state, part) => ({ ...content.attrs?.(state, part), "data-kind-popup": "" }),
        }),
        title: slot({ ...popupTitle(slot), state: (state) => ({ label: state.label }) }),
        description: slot({
          ...popupDescription(slot),
          state: (state, { api }) => ({ countText: api.countText(state) }),
        }),
      };
    },
    agent: { actions: ["open", "close"] as ("open" | "close")[] },
  };
};
