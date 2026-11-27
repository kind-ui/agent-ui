import {
  type ActionDetails,
  announce,
  type ChangeDetails,
  createPopup,
  definePrimitive,
  type PopupContentProps,
  type PopupContentState,
  type PopupPreset,
  type PopupState,
  type PopupTriggerProps,
  type PopupTriggerState,
  pageLocale,
  popupContent,
  popupDescription,
  popupState,
  popupTitle,
  popupTrigger,
  popupViewport,
  type SlotDefinition,
  toLocale,
} from "@ui-sdk/core";
import type { PopoverOpenChangeReason } from "@ui-sdk/core/popover";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { TokenUsage, UsageLimit, UsageSlice } from "../../types/index.js";
import { actionSource } from "../action-source.js";
import { hoverPopupPreset, withHover } from "../hover-popup.js";
import { memo } from "../memo.js";
import type { MotionMode } from "../motion/index.js";
import { createPendingAction } from "../pending.js";
import { withAutoPresentation } from "../presentation.js";
import { localTimeZone } from "../reset.js";
import { everyMinute } from "../today.js";
import { WORDS } from "../words.js";
import {
  type ContextBreakdown,
  type ContextLimitRow,
  type ContextRow,
  contextBreakdown,
  contextCountText,
  contextLimits,
  contextRatio,
  contextRows,
  contextValueText,
} from "./format.js";

/** `"normal"` below 80%, `"high"` from 80% and `"full"` from 95%. */
export type ContextLevel = "normal" | "high" | "full";

/** Why the details opened or closed: UI SDK Popover's reasons, and `"trigger-focus"` for keyboard focus. */
export type ContextMeterOpenChangeReason = PopoverOpenChangeReason | "trigger-focus";

export type ContextMeterOptions = {
  /**
   * Tokens the conversation takes up in the context window.
   * @default 0
   */
  used?: number;
  /**
   * Tokens the context window holds.
   * @default 0
   */
  total?: number;
  /** Token counts the details list: input, output, reasoning and cached. Only the counts you supply show. */
  usage?: TokenUsage;
  /** What the conversation has cost so far, in `currency`. The details show it when supplied. */
  cost?: number;
  /**
   * The ISO 4217 code `cost` is in, like `"EUR"`.
   * @default "USD"
   */
  currency?: string;
  /**
   * The locale numbers are formatted in, like `"de-DE"`. Defaults to the page's `lang`, or the browser's language
   * without one, once the meter is in the page; server markup uses English until then.
   */
  locale?: string;
  /**
   * Names the meter.
   * @default "Context"
   */
  label?: string;
  /** Whether the details are open. Passing it controls them: change it in `onOpenChange`. */
  open?: boolean;
  /**
   * Whether the details are open at first, when `open` isn't passed.
   * @default false
   */
  defaultOpen?: boolean;
  /** Called when the details open or close, with what caused it. */
  onOpenChange?: (open: boolean, details: ChangeDetails<ContextMeterOpenChangeReason>) => void;
  /**
   * How the ring fills and the details open: at full motion the ring sweeps and the details rise in; reduced motion
   * only fades. `"auto"` follows `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
  /**
   * What fills the window, in tokens, like messages, files and tools. The details show it as a stacked bar and a row
   * per slice, then Free space. Slices mustn't overlap.
   */
  breakdown?: UsageSlice[];
  /** Where the conversation compacts, from 0 to 1, marked on the bar. */
  compactAt?: number;
  /**
   * Called when a person or `compact` compacts the conversation. Shows Compact while set. Return a promise to show
   * "Compacting" until it settles.
   */
  onCompact?: (details: ActionDetails) => unknown;
  /** Whether the conversation is compacting, as when the agent compacts it itself: "Compacting" takes Compact's place. */
  compacting?: boolean;
  /**
   * The plan's usage limits, like a 5-hour and a weekly limit, each a row with its reset and pace. From 80% used, the
   * ring shows the fullest limit instead of the context.
   */
  limits?: UsageLimit[];
  /**
   * `"inline"` puts the details in the page, without the ring, as on a settings page.
   * @default "popover"
   */
  layout?: "popover" | "inline";
  /**
   * How the details present: `"auto"` is a sheet on small touch screens, else a popover.
   * @default "auto"
   */
  presentation?: "auto" | "popover" | "sheet";
  /** The IANA time zone resets read in. Defaults to the page's, once the meter is in the page; UTC until then. */
  timeZone?: string;
};

export type ContextMeterState = PopupState & {
  /** The `label`, else "Context". */
  label: string;
  /** The `used` option. */
  used: number;
  /** The `total` option. */
  total: number;
  /** How full the window is, by the percentage shown. */
  level: ContextLevel;
  /** `usage.input`. */
  input: number | undefined;
  /** `usage.output`. */
  output: number | undefined;
  /** `usage.reasoning`. */
  reasoning: number | undefined;
  /** `usage.cached`. */
  cached: number | undefined;
  /** The `cost` option. */
  cost: number | undefined;
  /** The `currency`, else "USD". */
  currency: string;
  /** The `locale` option, when it's a valid tag. */
  locale: string | undefined;
  /** The page's language where the meter is, read once it's in the page. Null on the server. */
  pageLocale: string | null;
  /** The `motion` option. */
  motion: MotionMode;
  /** How full the context is, by the percentage shown, whatever the ring follows. */
  contextLevel: ContextLevel;
  /** The context's percentage, rounded. */
  percent: number;
  /** "57% full". */
  fullText: string;
  /** "Filling up" from 80%, "Almost full" from 95%, else empty. */
  levelText: string;
  /** The `breakdown` option. */
  breakdown: UsageSlice[] | undefined;
  /** The `compactAt` option, between 0 and 1. */
  compactAt: number | undefined;
  /** Whether `onCompact` is set. */
  canCompact: boolean;
  /** Whether the `compacting` option is set or a call to `onCompact` is pending. */
  compacting: boolean;
  /** True while a call to `onCompact` is pending. */
  compactPending: boolean;
  /** The `limits` option. */
  limits: UsageLimit[] | undefined;
  /** The limit the ring shows, from 80% used, by `id`; `null` while it shows the context. */
  ringLimit: string | null;
  /** The `layout` option. */
  layout: "popover" | "inline";
  /** The `timeZone` option, else the page's once the meter is in the page. Null on the server. */
  timeZone: string | null;
  /** Now, in milliseconds, read once a minute once the meter is in the page. Null on the server. */
  now: number | null;
};

/** What the bar shows: its segments and the compaction tick, and its name. */
export type ContextMeterBarState = ContextBreakdown & { compactAt: number | undefined };

/** The props the value part hands UI SDK's Meter. */
export type ContextMeterValueState = {
  /** Pass it to the Meter as its `value`. */
  value: number;
  /** Pass it to the Meter as its `max`. */
  max: number;
  /** Pass it to the Meter. */
  locale: string;
  /** Pass it to the Meter as its `aria-label`. */
  label: string;
  /** Pass it to the Meter, so screen readers hear the tokens as well as the percentage. */
  getValueLabel: () => string;
  /** The limit the ring shows, like "Weekly limit", written before the percentage; `undefined` for the context. */
  caption: string | undefined;
};

type Popup = ReturnType<typeof createPopup<ContextMeterOptions, ContextMeterState, PopupPreset>>;

export type ContextMeterApi = Omit<Popup, "open" | "close"> & {
  /** Opens the details. Offered only while they're closed. Returns whether the change was accepted. */
  readonly open: (() => boolean) | undefined;
  /** Closes the details. Offered only while they're open. Returns whether the change was accepted. */
  readonly close: (() => boolean) | undefined;
  /** What screen readers hear for the value, like "57,600 of 128,000 tokens, 45%". */
  valueText: (state: ContextMeterState) => string;
  /** The details' description, like "57,600 of 128,000 tokens": the button already shows the percentage. */
  countText: (state: ContextMeterState) => string;
  /** Hands the Meter its props. Called by the value slot. */
  valueState: (state: ContextMeterState) => ContextMeterValueState;
  /** The details' lines. Called by the rows slot. */
  rows: (state: ContextMeterState) => ContextRow[];
  /** Compacts the conversation, as Compact does. Offered while `onCompact` is set and nothing is compacting. */
  readonly compact: (() => boolean) | undefined;
  /** Compact's press. Called by the compact slot. */
  pressCompact: (event?: Event) => boolean;
  /** The breakdown's rows and the bar's name. Called by the bar and breakdown slots. */
  breakdownState: (state: ContextMeterState) => ContextMeterBarState;
  /** The limits' rows. Called by the limits slot. */
  limitRows: (state: ContextMeterState) => ContextLimitRow[];
};

type Slot<
  Props extends object = BaseSlotProps,
  Public extends object = Record<never, never>,
> = SlotDefinition<ContextMeterState, ContextMeterApi, Props, Public>;

type ContextMeterSlots = {
  root: Slot;
  trigger: Slot<PopupTriggerProps & BaseSlotProps, PopupTriggerState>;
  value: Slot<BaseSlotProps, ContextMeterValueState>;
  content: Slot<PopupContentProps & BaseSlotProps, PopupContentState>;
  title: Slot<BaseSlotProps, { label: string }>;
  description: Slot<BaseSlotProps, { countText: string }>;
  rows: Slot<BaseSlotProps, { rows: ContextRow[] }>;
  viewport: Slot;
  compact: Slot;
  compacting: Slot<BaseSlotProps, { text: string }>;
  "compacting-icon": Slot;
  bar: Slot<BaseSlotProps, ContextMeterBarState>;
  breakdown: Slot<BaseSlotProps, ContextMeterBarState>;
  limits: Slot<BaseSlotProps, { limits: ContextLimitRow[] }>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type ContextMeterPrimitive = ReturnType<
  typeof definePrimitive<ContextMeterOptions, ContextMeterState, ContextMeterApi, ContextMeterSlots>
>;

const count = (value: number | undefined) => (value !== undefined && Number.isFinite(value) ? value : 0);

const levelOf = (percent: number): ContextLevel =>
  percent >= 95 ? "full" : percent >= 80 ? "high" : "normal";
const LEVEL_WORDS: Record<ContextLevel, string> = {
  normal: "",
  high: WORDS.fillingUp,
  full: WORDS.almostFull,
};

/** The fullest limit from 80% used, which the ring shows. */
const fullestLimit = (limits: UsageLimit[] | undefined) => {
  let found: { limit: UsageLimit; percent: number } | undefined;
  for (const limit of limits ?? []) {
    const percent = Math.round(contextRatio(count(limit.used), count(limit.total)) * 100);
    if (percent >= 80 && (!found || percent > found.percent)) found = { limit, percent };
  }
  return found;
};

const presentation = (
  options: ContextMeterOptions,
): Omit<
  ContextMeterState,
  keyof PopupState | "pageLocale" | "compactPending" | "compacting" | "now" | "timeZone"
> => {
  const used = count(options.used);
  const total = count(options.total);
  const percent = Math.round(contextRatio(used, total) * 100);
  const ring = fullestLimit(options.limits);
  const contextLevel = levelOf(percent);
  const compactAt = options.compactAt;
  return {
    label: options.label ?? "Context",
    used,
    total,
    level: ring ? levelOf(ring.percent) : contextLevel,
    contextLevel,
    percent,
    fullText: `${percent}${WORDS.percentFull}`,
    levelText: LEVEL_WORDS[contextLevel],
    breakdown: options.breakdown,
    compactAt:
      compactAt !== undefined && Number.isFinite(compactAt) ? Math.min(Math.max(compactAt, 0), 1) : undefined,
    canCompact: typeof options.onCompact === "function",
    limits: options.limits,
    ringLimit: ring?.limit.id ?? null,
    layout: options.layout === "inline" ? "inline" : "popover",
    input: options.usage?.input,
    output: options.usage?.output,
    reasoning: options.usage?.reasoning,
    cached: options.usage?.cached,
    cost: options.cost,
    currency: options.currency ?? "USD",
    locale: toLocale(options.locale),
    motion: options.motion ?? "auto",
  };
};

export const contextMeterPrimitive: ContextMeterPrimitive = definePrimitive<
  ContextMeterOptions,
  ContextMeterState,
  ContextMeterApi,
  ContextMeterSlots
>({
  name: "kind-context-meter",
  options: {
    used: "number",
    total: "number",
    usage: "value",
    cost: "number",
    currency: "string",
    locale: "string",
    label: "string",
    open: "boolean",
    defaultOpen: "boolean",
    onOpenChange: "callback",
    motion: "string",
    breakdown: "value",
    compactAt: "number",
    onCompact: "action",
    compacting: "boolean",
    limits: "value",
    layout: "string",
    presentation: "string",
    timeZone: "string",
  },
  state: (options) => ({
    ...popupState(options),
    ...presentation(options),
    pageLocale: null,
    compactPending: false,
    compacting: options.compacting ?? false,
    timeZone: options.timeZone ?? null,
    now: null,
  }),
  sync: (options) => ({
    ...presentation(options),
    ...(options.open === undefined ? {} : { open: options.open }),
    ...(options.timeZone === undefined ? {} : { timeZone: options.timeZone }),
  }),
  controlled: ["open"],
  api: (context) => {
    const popup = createPopup(
      { ...context, options: () => withHover(withAutoPresentation(context.options())) },
      { preset: hoverPopupPreset },
    );
    const { store } = context;
    const pending = createPendingAction(context, { state: "compactPending" });
    // `compacting` in state is the option or a pending call, so it follows both.
    let hostCompacting = store.get().compacting;
    const follow = () => {
      const { compacting, compactPending } = store.get();
      const next = hostCompacting || compactPending;
      if (compacting !== next) store.set({ compacting: next });
    };
    context.onOptions((options) => {
      hostCompacting = options.compacting ?? false;
      follow();
    });
    store.subscribe(follow);
    const compact = (event?: Event) => {
      const { onCompact } = context.options();
      if (!onCompact || store.get().compacting) return false;
      const details: ActionDetails = { source: actionSource(event, "compact-press") };
      const run = pending.run(() => onCompact(details));
      if (!run) return false;
      void run.then((outcome) => {
        if (outcome === "failed") announce("Couldn't compact", { priority: "polite" });
      });
      return true;
    };
    const ringOf = (state: ContextMeterState) =>
      state.ringLimit === null ? undefined : state.limits?.find((limit) => limit.id === state.ringLimit);
    const breakdownState = memo(
      (
        breakdown: UsageSlice[] | undefined,
        used: number,
        total: number,
        fullText: string,
        compactAt: number | undefined,
        locale: string,
      ): ContextMeterBarState => ({
        ...contextBreakdown(breakdown ?? [], used, total, fullText, locale),
        compactAt,
      }),
    );
    const limitRows = memo(
      (
        limits: UsageLimit[] | undefined,
        now: number | null,
        locale: string,
        timeZone: string | null,
        inline: boolean,
      ) =>
        contextLimits(limits ?? [], {
          now: now ?? undefined,
          locale,
          timeZone: timeZone ?? undefined,
          amount: inline,
        }),
    );
    // Server markup is English, as UI SDK Meter's is, so it never disagrees with the client's.
    const localeOf = (state: ContextMeterState) => state.locale ?? state.pageLocale ?? "en-US";
    const valueText = memo(contextValueText);
    const countText = memo(contextCountText);
    const valueState = memo(
      (
        value: number,
        max: number,
        locale: string,
        label: string,
        valueText: string,
        caption: string | undefined,
      ) => ({
        value,
        max,
        locale,
        label,
        getValueLabel: () => valueText,
        caption,
      }),
    );
    const ringText = (state: ContextMeterState) => {
      const limit = ringOf(state);
      if (!limit) return valueText(state.used, state.total, localeOf(state));
      const row = limitRows(state.limits, state.now, localeOf(state), state.timeZone, false).find(
        (each) => each.id === limit.id,
      );
      return `${limit.label}, ${row?.percent ?? ""} ${WORDS.used}`;
    };
    const rows = memo(
      (
        input: number | undefined,
        output: number | undefined,
        reasoning: number | undefined,
        cached: number | undefined,
        cost: number | undefined,
        currency: string,
        locale: string,
      ) => contextRows({ input, output, reasoning, cached }, cost, currency, locale),
    );
    return {
      ...popup,
      get open() {
        return store.get().open ? undefined : () => popup.setOpen(true);
      },
      get close() {
        return store.get().open ? () => popup.setOpen(false) : undefined;
      },
      get compact() {
        const { canCompact, compacting } = store.get();
        return canCompact && !compacting ? () => compact() : undefined;
      },
      pressCompact: compact,
      valueText: ringText,
      countText: (state) => {
        const text = countText(state.used, state.total, localeOf(state));
        return state.compactAt !== undefined && state.contextLevel !== "normal"
          ? `${text} · ${WORDS.compactsAt} ${Math.round(state.compactAt * 100)}%`
          : text;
      },
      valueState: (state) => {
        const limit = ringOf(state);
        return limit
          ? valueState(
              count(limit.used),
              count(limit.total),
              localeOf(state),
              limit.label,
              ringText(state),
              limit.label,
            )
          : valueState(state.used, state.total, localeOf(state), state.label, ringText(state), undefined);
      },
      breakdownState: (state) =>
        breakdownState(
          state.breakdown,
          state.used,
          state.total,
          state.fullText,
          state.compactAt,
          localeOf(state),
        ),
      limitRows: (state) =>
        limitRows(state.limits, state.now, localeOf(state), state.timeZone, state.layout === "inline"),
      rows: (state) =>
        rows(
          state.input,
          state.output,
          state.reasoning,
          state.cached,
          state.cost,
          state.currency,
          localeOf(state),
        ),
    };
  },
  slots: (slot) => {
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
          store.set({
            pageLocale: pageLocale(el) ?? null,
            timeZone: store.get().timeZone ?? localTimeZone() ?? null,
            now: Date.now(),
          });
          return everyMinute(() => store.set({ now: Date.now() }));
        },
      }),
      // Named by its value, since the meter inside a button isn't read on its own.
      trigger: slot({
        ...trigger,
        present: (state) => state.layout !== "inline",
        attrs: (state, part) => ({
          ...trigger.attrs?.(state, part),
          type: "button",
          "aria-label": part.api.valueText(state),
          "data-kind-trigger": "",
          "data-kind-size": "sm",
        }),
      }),
      value: slot<BaseSlotProps, ContextMeterValueState>({
        state: (state, { api }) => api.valueState(state),
      }),
      content: slot({
        ...content,
        present: (state, part) => state.layout !== "inline" && (content.present?.(state, part) ?? true),
        attrs: (state, part) => ({
          ...content.attrs?.(state, part),
          "data-kind-popup": "",
          "data-motion": state.motion,
        }),
      }),
      // The full-screen element the content sits in while it presents as a sheet: render it around the content then.
      viewport: popupViewport(slot),
      title: slot({
        ...popupTitle(slot),
        state: (state) => ({ label: state.label, fullText: state.fullText, levelText: state.levelText }),
        attrs: (state, part) => ({
          ...popupTitle(slot).attrs?.(state, part),
          "data-level": state.contextLevel,
        }),
      }),
      description: slot({
        ...popupDescription(slot),
        state: (state, { api }) => ({ countText: api.countText(state) }),
      }),
      rows: slot<BaseSlotProps, { rows: ContextRow[] }>({
        present: (state, { api }) => api.rows(state).length > 0,
        state: (state, { api }) => ({ rows: api.rows(state) }),
      }),
      compact: slot({
        role: "button",
        focus: "native",
        present: (state) => state.canCompact && !state.compacting,
        press: ({ api }, event) => api.pressCompact(event),
        attrs: () => ({ type: "button", "data-kind-button": "", "data-kind-size": "sm" }),
      }),
      compacting: slot<BaseSlotProps, { text: string }>({
        present: (state) => state.compacting,
        state: () => ({ text: WORDS.compacting }),
      }),
      "compacting-icon": slot({
        attrs: (state) => ({
          "aria-hidden": "true",
          "data-status-mark": "",
          "data-status": "running",
          "data-motion": state.motion,
        }),
      }),
      // One image named by the whole breakdown as a sentence; the rows below say it again, one by one.
      bar: slot<BaseSlotProps, ContextMeterBarState>({
        role: "img",
        present: (state) => state.breakdown !== undefined,
        state: (state, { api }) => api.breakdownState(state),
        attrs: (state, { api }) => {
          const { label, compactAt } = api.breakdownState(state);
          return {
            "aria-label": label,
            style:
              compactAt === undefined ? undefined : `--kind-context-meter-compact-at: ${compactAt * 100}%`,
            "data-compact-at": compactAt === undefined ? undefined : "",
          };
        },
      }),
      breakdown: slot<BaseSlotProps, ContextMeterBarState>({
        present: (state) => state.breakdown !== undefined,
        state: (state, { api }) => api.breakdownState(state),
        attrs: (state) => ({ "aria-label": state.label }),
      }),
      limits: slot<BaseSlotProps, { limits: ContextLimitRow[] }>({
        present: (state) => (state.limits?.length ?? 0) > 0,
        state: (state, { api }) => ({ limits: api.limitRows(state) }),
      }),
    };
  },
  agent: { actions: ["open", "close", "compact"] },
});
