import { pageLocale, type SlotDefinition } from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { definePrimitive } from "../define-primitive.js";
import { memo } from "../memo.js";
import { dayKey, dayLabel, todayKey } from "../time.js";
import { everyMinute } from "../today.js";

export type DaySeparatorOptions = {
  /**
   * The day the heading names: an ISO date (`"2026-11-18"`) or date-time, read in `timeZone`. Without a valid one the
   * heading is `hidden`.
   */
  date?: string;
  /** A BCP 47 tag the day reads in. Defaults to the page's language in the browser, and English on the server. */
  locale?: string;
  /**
   * The IANA time zone that decides which day a date-time falls on, and which day is today.
   * @default "UTC"
   */
  timeZone?: string;
  /**
   * The heading level, 1 to 6. Anything else reads as 3.
   * @default 3
   */
  level?: number;
  /**
   * Whether a recent day reads "Today", "Yesterday" or its weekday in the browser. Server markup always shows the date.
   * @default true
   */
  relative?: boolean;
};

export type DaySeparatorState = {
  /** The `date` option, `""` without one. */
  date: string;
  /** The `locale` option, before the page's language fills in for it. */
  locale: string | undefined;
  /** The `timeZone` option; `undefined` reads as UTC. */
  timeZone: string | undefined;
  /** The heading level, 1 to 6. */
  level: number;
  /** The `relative` option, `true` by default. */
  relative: boolean;
  /** The page's language and today's date, read in the browser; `null` on the server. */
  pageLocale: string | null;
  today: string | null;
};

/** What the label's render function sees: the day in words and its `<time datetime>` value. */
export type DaySeparatorLabelState = { label: string; dateTime: string | undefined };

type DaySeparatorApi = { labelState: (state: DaySeparatorState) => DaySeparatorLabelState };

type DaySeparatorSlot<Public extends object = Record<never, never>> = SlotDefinition<
  DaySeparatorState,
  DaySeparatorApi,
  BaseSlotProps,
  Public
>;

type DaySeparatorSlots = { root: DaySeparatorSlot; label: DaySeparatorSlot<DaySeparatorLabelState> };

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type DaySeparatorPrimitive = ReturnType<
  typeof definePrimitive<DaySeparatorOptions, DaySeparatorState, DaySeparatorApi, DaySeparatorSlots>
>;

const presentation = (options: DaySeparatorOptions): Omit<DaySeparatorState, "pageLocale" | "today"> => {
  const { level } = options;
  return {
    date: options.date ?? "",
    locale: options.locale,
    timeZone: options.timeZone,
    // Web attributes are untyped: a level outside 1 to 6 reads as the default.
    level: level !== undefined && Number.isInteger(level) && level >= 1 && level <= 6 ? level : 3,
    relative: options.relative ?? true,
  };
};

export const daySeparatorPrimitive: DaySeparatorPrimitive = definePrimitive<
  DaySeparatorOptions,
  DaySeparatorState,
  DaySeparatorApi,
  DaySeparatorSlots
>({
  name: "kind-day-separator",
  options: { date: "string", locale: "string", timeZone: "string", level: "number", relative: "boolean" },
  state: (options) => ({ ...presentation(options), pageLocale: null, today: null }),
  sync: presentation,
  api: () => {
    const labelState = memo(
      (date: string, now: string | undefined, locale: string | undefined, timeZone: string | undefined) => ({
        label: dayLabel(date, { now, locale, timeZone }),
        dateTime: dayKey(date, timeZone),
      }),
    );
    return {
      labelState: (state) =>
        labelState(
          state.date,
          (state.relative && state.today) || undefined,
          state.locale ?? state.pageLocale ?? undefined,
          state.timeZone,
        ),
    };
  },
  slots: (slot) => ({
    root: slot({
      role: "heading",
      attrs: (state, { api }) => ({
        "aria-level": String(state.level),
        hidden: api.labelState(state).dateTime === undefined ? "" : undefined,
      }),
      bind: (el, { store }) => {
        // Read here, never in `state`, so server markup shows the date and hydrates before the words change.
        const readToday = () => {
          const today = todayKey(store.get().timeZone);
          if (store.get().today !== today) store.set({ today });
        };
        store.set({ pageLocale: pageLocale(el) ?? null, today: todayKey(store.get().timeZone) });
        const unsubscribe = store.subscribe(readToday);
        const stop = everyMinute(readToday);
        return () => {
          unsubscribe();
          stop();
        };
      },
    }),
    label: slot<BaseSlotProps, DaySeparatorLabelState>({
      attrs: (state, { api }) => {
        const { dateTime } = api.labelState(state);
        return dateTime === undefined ? {} : { dateTime };
      },
      state: (state, { api }) => api.labelState(state),
    }),
  }),
});
