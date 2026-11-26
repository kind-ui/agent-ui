import {
  byCell,
  type ChangeDetails,
  createGridFocus,
  css,
  definePrimitive,
  dispatch,
  type GridCell,
  pageLocale,
  type SlotDefinition,
  selects,
  toLocale,
} from "@ui-sdk/core";
import { firstDayOfWeek, formatDate, isISODate, monthNames, weekday, weekdayNames } from "@ui-sdk/core/date";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { ActivityDay } from "../../types/index.js";
import { memo } from "../memo.js";
import { dayKey, todayKey } from "../time.js";
import { everyMinute } from "../today.js";
import { type ActivityWeek, activityLevels, activityWeeks } from "./levels.js";

/** `"item-press"`: a person pressed a day or pressed Enter on it. `"imperative"`: an `api` call, like an agent's `select`. */
export type ActivityGraphSelectReason = "item-press" | "imperative";

export type ActivityGraphOptions = {
  /**
   * How much happened on each day. Days left out count as none; two entries for one day add up.
   * @default []
   */
  days?: ActivityDay[];
  /**
   * Names the graph.
   * @default "Activity"
   */
  label?: string;
  /**
   * What the counts are, in the plural: a day reads "12 runs on Tuesday, November 3, 2026".
   * @default "runs"
   */
  unit?: string;
  /** What one is, for a day with a count of 1. Defaults to "run" with the default `unit`, else to `unit`. */
  unitOne?: string;
  /**
   * How many weeks the graph shows, ending with today's.
   * @default 53
   */
  weeks?: number;
  /**
   * How many shades days above zero take, from the fewest to the most, each holding about as many days.
   * @default 4
   */
  levels?: number;
  /** The weeks' first day, 0 for Sunday to 6 for Saturday. Defaults to the locale's, else Sunday. */
  weekStart?: number;
  /**
   * The last day shown, `YYYY-MM-DD` or an ISO date-time read in `timeZone`. Defaults to today in the browser; server
   * markup ends with the last day in `days` until then.
   */
  now?: string;
  /** Called with a day's date when a person presses it or `select` chooses it. Without it days can't be chosen. */
  onSelect?: (date: string, details: ChangeDetails<ActivityGraphSelectReason>) => void;
  /** A BCP 47 tag the dates and numbers read in. Defaults to the page's language in the browser, and English on the server. */
  locale?: string;
  /**
   * The IANA time zone that decides which day is today.
   * @default "UTC"
   */
  timeZone?: string;
};

export type ActivityGraphState = {
  /** The `days`. */
  days: readonly ActivityDay[];
  /** The `label`, else "Activity". */
  label: string;
  /** The `unit`, else "runs". */
  unit: string;
  /** The `unitOne`, else "run" with the default `unit`, else `unit`. */
  unitOne: string;
  /** The `weeks`, a whole number from 1, else 53. */
  weeks: number;
  /** The `levels`, a whole number from 1, else 4. */
  levels: number;
  /** The `weekStart`, 0 to 6, before the locale's fills in for it. */
  weekStart: number | undefined;
  /** The `now` option as a date, before today fills in for it. */
  now: string | undefined;
  /** The `locale` option, before the page's language fills in for it. */
  locale: string | undefined;
  /** The `timeZone` option; `undefined` reads as UTC. */
  timeZone: string | undefined;
  /** Whether `onSelect` is set. */
  canSelect: boolean;
  /** The page's language and today's date, read in the browser; `null` on the server. */
  pageLocale: string | null;
  today: string | null;
  /** The day with the Tab stop, by its weekday row and week column; `null` before the grid is entered. */
  active: GridCell | null;
};

/** A day's cell, by its weekday `row` and week `col`; `value` is `"<row>:<col>"`. */
export type ActivityGraphCellProps = { value: string; row: number; col: number };

/** What the grid's render function sees: its seven weekday rows and their cells. */
export type ActivityGraphGridState = {
  rows: { value: string; cells: ActivityGraphCellProps[] }[];
};
/** What the month labels' render function sees: a `value` per labelled week column. */
export type ActivityGraphMonthsState = { months: { value: string }[] };
/** A month label's or a weekday's words. */
export type ActivityGraphLabelState = { label: string };
/** What the legend's render function sees: its words and a `value` per level, 0 included. */
export type ActivityGraphLegendState = { less: string; more: string; levels: { value: string }[] };
/** The summary's words, like "812 runs in the last year". */
export type ActivityGraphSummaryState = { text: string };

/** A day as the graph shows it. */
export type ActivityGraphDay = {
  date: string;
  count: number;
  level: number;
  /** After `now`: an empty cell that can't take focus. */
  future: boolean;
  /** "12 runs on Tuesday, November 3, 2026". */
  label: string;
};

/** The days, their levels and the words around them. */
export type ActivityGraphModel = {
  /** By week column, then weekday row. */
  days: ActivityGraphDay[][];
  byDate: Map<string, ActivityGraphDay>;
  weekdays: { short: string }[];
  months: { col: number; label: string }[];
  summary: string;
};

export type ActivityGraphApi = {
  /** The days, their levels and words, built from the state. */
  model: (state: ActivityGraphState) => ActivityGraphModel;
  gridState: (state: ActivityGraphState) => ActivityGraphGridState;
  monthsState: (state: ActivityGraphState) => ActivityGraphMonthsState;
  legendState: (state: ActivityGraphState) => ActivityGraphLegendState;
  /** The days a person could reach, with their words, for the agent bridge. */
  dayItems: () => { value: string; label: string }[];
  grid: ReturnType<typeof createGridFocus<ActivityGraphState>>;
  /** Calls `onSelect` with a day before `now`, as pressing it does. Offered while `onSelect` is set. */
  readonly select: ((date: string) => boolean) | undefined;
  press: (cell: GridCell, event?: Event) => void;
  /** Gives a day focus reached some other way, like Tab, the Tab stop. */
  focusCell: (cell: GridCell) => void;
  keydown: (cell: GridCell, event: KeyboardEvent) => void;
};

type Slot<
  Props extends object = BaseSlotProps,
  Public extends object = Record<never, never>,
> = SlotDefinition<ActivityGraphState, ActivityGraphApi, Props, Public>;

type ValueProps = { value: string } & BaseSlotProps;

type ActivityGraphSlots = {
  root: Slot;
  viewport: Slot;
  grid: Slot<BaseSlotProps, ActivityGraphGridState>;
  months: Slot<BaseSlotProps, ActivityGraphMonthsState>;
  month: Slot<ValueProps, ActivityGraphLabelState>;
  row: Slot<ValueProps>;
  weekday: Slot<ValueProps, ActivityGraphLabelState>;
  cell: Slot<ActivityGraphCellProps & BaseSlotProps>;
  legend: Slot<BaseSlotProps, ActivityGraphLegendState>;
  swatch: Slot<ValueProps>;
  summary: Slot<BaseSlotProps, ActivityGraphSummaryState>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type ActivityGraphPrimitive = ReturnType<
  typeof definePrimitive<ActivityGraphOptions, ActivityGraphState, ActivityGraphApi, ActivityGraphSlots>
>;

const NO_DAYS: readonly ActivityDay[] = [];

// Web attributes are untyped: anything but a whole number in range reads as the default.
const whole = (value: number | undefined, min: number, max: number, fallback: number) =>
  value !== undefined && Number.isInteger(value) && value >= min && value <= max ? value : fallback;

const presentation = (
  options: ActivityGraphOptions,
): Omit<ActivityGraphState, "pageLocale" | "today" | "active"> => {
  const unit = options.unit || "runs";
  return {
    days: options.days ?? NO_DAYS,
    label: options.label || "Activity",
    unit,
    unitOne: options.unitOne || (options.unit ? unit : "run"),
    weeks: whole(options.weeks, 1, 520, 53),
    levels: whole(options.levels, 1, 20, 4),
    weekStart: options.weekStart === undefined ? undefined : whole(options.weekStart, 0, 6, 0),
    now: options.now === undefined ? undefined : dayKey(options.now, options.timeZone),
    locale: options.locale,
    timeZone: options.timeZone,
    canSelect: options.onSelect !== undefined,
  };
};

const lastDay = (days: readonly ActivityDay[]) => {
  let last: string | undefined;
  for (const { date } of days) if (isISODate(date) && (last === undefined || date > last)) last = date;
  return last;
};

// A label within this many columns of the next one would run into it.
const MONTH_GAP = 3;

const monthLabels = (weeks: ActivityWeek[], names: string[]) => {
  const starts: { col: number; label: string }[] = [];
  let month = "";
  weeks.forEach((week, col) => {
    const next = week.start.slice(0, 7);
    if (next !== month) starts.push({ col, label: names[Number(next.slice(5, 7)) - 1] ?? "" });
    month = next;
  });
  return starts.filter((start, index) => {
    const next = starts[index + 1];
    return !next || next.col - start.col >= MONTH_GAP;
  });
};

const buildModel = (
  days: readonly ActivityDay[],
  now: string,
  weeks: number,
  levels: number,
  weekStart: number,
  locale: string,
  unit: string,
  unitOne: string,
): ActivityGraphModel => {
  const columns = activityWeeks(days, { now, weeks, weekStart });
  const counts = columns.flatMap((week) => week.days.filter((day) => !day.future).map((day) => day.count));
  const levelOf = new Map<number, number>();
  for (const [index, level] of activityLevels(counts, levels).entries())
    levelOf.set(counts[index] as number, level);
  const number = new Intl.NumberFormat(locale);
  const amount = (count: number) =>
    count === 0 ? `No ${unit}` : `${number.format(count)} ${count === 1 ? unitOne : unit}`;
  const byDate = new Map<string, ActivityGraphDay>();
  let total = 0;
  const graph = columns.map((week) =>
    week.days.map((day) => {
      const entry: ActivityGraphDay = {
        date: day.date,
        count: day.count,
        level: day.future ? 0 : (levelOf.get(day.count) ?? 0),
        future: day.future,
        label: day.future ? "" : `${amount(day.count)} on ${formatDate(day.date, locale)}`,
      };
      if (!day.future) {
        total += day.count;
        byDate.set(day.date, entry);
      }
      return entry;
    }),
  );
  const span = weeks >= 52 ? "the last year" : weeks === 1 ? "this week" : `the last ${weeks} weeks`;
  return {
    days: graph,
    byDate,
    weekdays: weekdayNames(locale, "short", weekStart).map((short) => ({ short })),
    months: monthLabels(columns, monthNames(locale, "short")),
    summary: `${amount(total)} in ${span}`,
  };
};

// The day the graph ends with, its language and its first weekday.
const resolve = (state: ActivityGraphState) => {
  const locale = toLocale(state.locale ?? state.pageLocale ?? "en") ?? "en";
  return {
    locale,
    now: state.now ?? state.today ?? lastDay(state.days) ?? todayKey(state.timeZone),
    weekStart: state.weekStart ?? firstDayOfWeek(locale),
  };
};

// `now`'s cell, which holds the Tab stop until the grid is entered, so Tab lands on the latest day.
const homeOf = (state: ActivityGraphState): GridCell => {
  const { now, weekStart } = resolve(state);
  return { row: (weekday(now) - weekStart + 7) % 7, col: state.weeks - 1 };
};

const cellOf = (value: string): GridCell | undefined => {
  const [row, col] = value.split(":").map(Number);
  return Number.isInteger(row) && Number.isInteger(col)
    ? { row: row as number, col: col as number }
    : undefined;
};

const sameCell = (a: GridCell | null | undefined, b: GridCell | null | undefined) =>
  !!a && !!b && a.row === b.row && a.col === b.col;

// A move reaches only the cells it leaves and lands on; nothing outside the cells reads `active`.
const outsideCells = selects<ActivityGraphState, ActivityGraphApi, BaseSlotProps>({ active: [] });

export const activityGraphPrimitive: ActivityGraphPrimitive = definePrimitive<
  ActivityGraphOptions,
  ActivityGraphState,
  ActivityGraphApi,
  ActivityGraphSlots
>({
  name: "kind-activity-graph",
  options: {
    days: "value",
    label: "string",
    unit: "string",
    unitOne: "string",
    weeks: "number",
    levels: "number",
    weekStart: "number",
    now: "string",
    onSelect: "callback",
    locale: "string",
    timeZone: "string",
  },
  state: (options) => {
    const state = { ...presentation(options), pageLocale: null, today: null, active: null };
    return { ...state, active: homeOf(state) };
  },
  sync: presentation,
  api: (context) => {
    const { store } = context;
    const modelOf = memo(buildModel);
    const model = (state: ActivityGraphState) => {
      const { locale, now, weekStart } = resolve(state);
      return modelOf(
        state.days,
        now,
        state.weeks,
        state.levels,
        weekStart,
        locale,
        state.unit,
        state.unitOne,
      );
    };
    const gridState = memo(
      (weeks: number): ActivityGraphGridState => ({
        rows: Array.from({ length: 7 }, (_, row) => ({
          value: String(row),
          cells: Array.from({ length: weeks }, (_, col) => ({ value: `${row}:${col}`, row, col })),
        })),
      }),
    );
    const monthsState = memo((months: ActivityGraphModel["months"]) => ({
      months: months.map(({ col }) => ({ value: String(col) })),
    }));
    const legendState = memo((levels: number) => ({
      less: "Less",
      more: "More",
      levels: Array.from({ length: levels + 1 }, (_, level) => ({ value: String(level) })),
    }));
    const dayAt = (cell: GridCell) => model(store.get()).days[cell.col]?.[cell.row];

    const grid = createGridFocus(context, {
      key: "active",
      rows: () => 7,
      cols: () => store.get().weeks,
      disabled: (cell) => dayAt(cell)?.future ?? true,
      onMove: () => {
        entered = true;
      },
    });
    let entered = false;
    store.subscribe(() => {
      if (entered) return;
      const home = homeOf(store.get());
      if (!sameCell(home, store.get().active)) store.set({ active: home });
    });

    const select = (date: string, event?: Event) => {
      const state = store.get();
      if (!state.canSelect || !model(state).byDate.has(date)) return false;
      return !dispatch(
        context,
        "onSelect",
        date,
        event ? { reason: "item-press", event } : { reason: "imperative" },
      );
    };

    return {
      model,
      gridState: (state) => gridState(state.weeks),
      monthsState: (state) => monthsState(model(state).months),
      legendState: (state) => legendState(state.levels),
      dayItems: () =>
        [...model(store.get()).byDate.values()].map((day) => ({ value: day.date, label: day.label })),
      grid,
      get select() {
        return store.get().canSelect ? (date: string) => select(date) : undefined;
      },
      focusCell: (cell) => {
        entered = true;
        if (!grid.isActive(store.get(), cell)) grid.focus(cell);
      },
      press: (cell, event) => {
        const day = dayAt(cell);
        if (day && !day.future) select(day.date, event);
      },
      keydown: (cell, event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          const day = dayAt(cell);
          if (day && !day.future) select(day.date, event);
          return;
        }
        // Home and End stay within the week, as in a calendar; with Control or Command the grid's corners.
        if (
          (event.key === "Home" || event.key === "End") &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey
        ) {
          const rows = event.key === "Home" ? [0, 1, 2, 3, 4, 5, 6] : [6, 5, 4, 3, 2, 1, 0];
          const row = rows.find((each) => dayAt({ row: each, col: cell.col })?.future === false);
          event.preventDefault();
          if (row !== undefined) grid.focus({ row, col: cell.col }, { reason: "list-navigation", event });
          return;
        }
        grid.keydown(event);
      },
    };
  },
  slots: (slot) => ({
    root: slot({
      role: "group",
      selects: outsideCells,
      attrs: (state) => ({ "aria-label": state.label }),
      bind: (el, { store }) => {
        // Read here, never in `state`, so server markup ends with the data's last day and hydrates before it moves.
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
    viewport: slot({ selects: outsideCells }),
    grid: slot<BaseSlotProps, ActivityGraphGridState>({
      role: "grid",
      keys: { none: "Focus stays on a day, whose keydown moves it." },
      selects: outsideCells,
      state: (state, { api }) => api.gridState(state),
      attrs: (state, { id }) => ({
        "aria-label": state.label,
        "aria-describedby": `${id}-summary`,
      }),
    }),
    months: slot<BaseSlotProps, ActivityGraphMonthsState>({
      selects: outsideCells,
      state: (state, { api }) => api.monthsState(state),
      attrs: () => ({ "aria-hidden": "true" }),
    }),
    month: slot<ValueProps, ActivityGraphLabelState>({
      props: { value: "string" },
      selects: outsideCells,
      state: (state, { api, key }) => ({
        label: api.model(state).months.find((month) => String(month.col) === key)?.label ?? "",
      }),
      attrs: (_state, { key }) => ({ style: css({ "--kind-activity-col": key }) }),
    }),
    row: slot<ValueProps>({ role: "row", props: { value: "string" }, selects: outsideCells }),
    weekday: slot<ValueProps, ActivityGraphLabelState>({
      role: "rowheader",
      props: { value: "string" },
      selects: outsideCells,
      state: (state, { api, key }) => ({ label: api.model(state).weekdays[Number(key)]?.short ?? "" }),
      // Every other weekday shows, as the rows are shorter than a line; the rest are read, not seen.
      attrs: (_state, { key }) => ({ "data-quiet": Number(key) % 2 === 0 ? "" : undefined }),
    }),
    cell: slot<ActivityGraphCellProps & BaseSlotProps>({
      role: "gridcell",
      focus: "roving",
      props: { value: "string", row: "number", col: "number" },
      selects: selects({ active: byCell }),
      keys: [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Home",
        "End",
        "mod+Home",
        "mod+End",
        "PageUp",
        "PageDown",
        "Enter",
      ],
      attrs: (state, { api, key }) => {
        const cell = cellOf(key);
        const day = cell && api.model(state).days[cell.col]?.[cell.row];
        if (!cell || !day) return {};
        return {
          tabindex: api.grid.tabIndex(state, cell),
          "aria-label": day.future ? undefined : day.label,
          "aria-disabled": day.future ? "true" : undefined,
          "data-date": day.date,
          "data-level": String(day.level),
          "data-future": day.future ? "" : undefined,
          "data-selectable": state.canSelect && !day.future ? "" : undefined,
          style: css({
            "--kind-activity-ratio": String(day.level / state.levels),
            "--kind-activity-fill": `var(--kind-activity-level-${day.level})`,
          }),
        };
      },
      on: {
        keydown: (event, { api, key }) => {
          const cell = cellOf(key);
          if (cell) api.keydown(cell, event as KeyboardEvent);
        },
        // A day to come can't take focus, from a press either.
        pointerdown: (event, { api, key }) => {
          const cell = cellOf(key);
          if (cell && !api.grid.focus(cell, { reason: "item-press", event })) event.preventDefault();
        },
        focus: (_event, { api, key }) => {
          const cell = cellOf(key);
          if (cell) api.focusCell(cell);
        },
        click: (event, { api, key }) => {
          const cell = cellOf(key);
          if (cell) api.press(cell, event);
        },
      },
      bind: (el, { api, key }) => {
        const cell = cellOf(key);
        return cell ? api.grid.bind(el, cell) : undefined;
      },
    }),
    legend: slot<BaseSlotProps, ActivityGraphLegendState>({
      selects: outsideCells,
      state: (state, { api }) => api.legendState(state),
      attrs: () => ({ "aria-hidden": "true" }),
    }),
    swatch: slot<ValueProps>({
      props: { value: "string" },
      selects: outsideCells,
      attrs: (state, { key }) => ({
        "data-level": key,
        style: css({
          "--kind-activity-ratio": String(Number(key) / state.levels),
          "--kind-activity-fill": `var(--kind-activity-level-${key})`,
        }),
      }),
    }),
    summary: slot<BaseSlotProps, ActivityGraphSummaryState>({
      selects: outsideCells,
      state: (state, { api }) => ({ text: api.model(state).summary }),
      attrs: (_state, { id }) => ({ id: `${id}-summary` }),
    }),
  }),
  agent: {
    actions: ["select"],
    items: (api) => api.dayItems(),
    closed: true,
  },
});
