import {
  type ChangeDetails,
  createChange,
  definePrimitive,
  isTypeaheadKey,
  type PrimitiveContext,
  type SlotDefinition,
  selects,
  type TreeItemData,
} from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { createTreeController, type TreeController } from "@ui-sdk/core/tree";
import type { StepStatus, TestCase, TestSuite } from "../../types/index.js";
import { cached, memo } from "../memo.js";
import type { MotionMode } from "../motion/index.js";
import { type StepApi, type StepOptions, type StepState, stepAnnouncement, stepBase } from "../step/base.js";
import { treeValues } from "../tree.js";
import {
  emptyTestsText,
  knownFilter,
  type TestCounts,
  type TestResultsFilter,
  testCounts,
  testItems,
  testStatus,
  testValue,
} from "./summary.js";

/**
 * `"item-press"`: a person pressed a count, or pressed the shown one again for every test. `"imperative"`: an `api`
 * call, like an agent's `setFilter`.
 */
export type TestResultsFilterChangeReason = "item-press" | "imperative";

/**
 * `"item-press"`: a press, or Enter, on a row. `"list-navigation"`: an arrow key or `*`. `"find-in-page"`: the
 * browser's find in page matched text inside. `"auto"`: a suite or test that started failing opened. `"imperative"`:
 * an `api` call, like an agent's `expand`.
 */
export type TestResultsExpandedChangeReason =
  | "item-press"
  | "list-navigation"
  | "find-in-page"
  | "auto"
  | "imperative";

export type TestResultsOptions = Omit<StepOptions, "status" | "label"> & {
  /**
   * The suites and their tests, as they finish. Pass new arrays and objects for what changed, and keep the rest:
   * rows are kept by object, so a suite you keep keeps its row's state. Ids can't hold `/`, which joins a test's to its suite's.
   * @default []
   */
  suites?: TestSuite[];
  /**
   * The title, which also names it in announcements.
   * @default "Tests"
   */
  label?: string;
  /** What the run is doing. Defaults to `error` once a test failed, else `complete`, or `pending` with no tests. */
  status?: StepStatus;
  /**
   * Which tests show, chosen by pressing a count in the header. Passing it controls it: change it in `onFilterChange`.
   */
  filter?: TestResultsFilter;
  /**
   * Which tests show at first, when `filter` isn't passed.
   * @default "all"
   */
  defaultFilter?: TestResultsFilter;
  /** Called when a person or `setFilter` chooses a filter, with why. */
  onFilterChange?: (filter: TestResultsFilter, details: ChangeDetails<TestResultsFilterChangeReason>) => void;
  /**
   * The open suites' ids and failed tests' `suiteId/testId` values. Passing it controls them: change them in
   * `onExpandedChange`.
   */
  expanded?: string[];
  /**
   * The open suites and failed tests at first, when `expanded` isn't passed. Defaults to every failing suite and
   * failed test. A suite or test that starts failing later opens too.
   */
  defaultExpanded?: string[];
  /** Called when suites or failed tests open or close, with why. */
  onExpandedChange?: (expanded: string[], details: ChangeDetails<TestResultsExpandedChangeReason>) => void;
};

/** A suite or test as its row shows it, which the item part hands its render function. */
export type TestResultsRow = {
  /** The suite's or test's name. */
  name: string;
  /** Whether it's a suite, which holds tests. */
  suite: boolean;
  /** A test's own; a suite fails with any failed test, is skipped when every test is, and passes otherwise. */
  status: TestCase["status"];
  /** How long it took, like "12 ms" or "1.4 s"; a suite's is its tests' total. Empty when unknown. */
  duration: string;
  /** A failed test's error message, else empty. */
  message: string;
  /** A failed test's stack trace, as JavaScript writes it. */
  stack: string | undefined;
};

export type TestResultsState = StepState & {
  /** The `suites`. */
  suites: TestSuite[];
  /** The `label`, else "Tests". */
  title: string;
  /** How many tests passed, failed and were skipped. */
  counts: TestCounts;
  /** The run's duration: `durationSeconds`, else its tests' total. Empty when unknown. */
  duration: string;
  /** Each suite's and test's row, by its value in the tree. A row that didn't change keeps its object. */
  rows: Record<string, TestResultsRow>;
  /** Which tests show. */
  filter: TestResultsFilter;
  /** The open suites and failed tests. */
  expanded: string[];
};

/** What the failure part hands its Stack Trace. */
export type TestResultsFailureState = {
  /** The test's error message, else empty. */
  message: string;
  /** The test's stack trace, as JavaScript writes it. */
  stack: string | undefined;
  /** The `motion` option. */
  motion: MotionMode;
};

/** What a count part hands its render function. */
export type TestResultsCountState = {
  /** How many tests have its status. */
  count: number;
  /** Its words, like "3 passed". */
  text: string;
};

/** What the tree part hands the Tree: pass every key to it. */
export type TestResultsTreeState = {
  /** The primitive's own, which it reads and writes the open rows through. */
  controller: TreeController;
  /** The rows the filter lets through, so keyboard navigation knows the whole tree. */
  items: TreeItemData[];
  /** The open rows when the Tree mounted. */
  defaultExpanded: string[];
  /** The title. */
  "aria-label": string;
  /** Rows open and close; none is selected. */
  mode: "none";
  /** Closed rows stay in the page, so find in page matches a failure's text and rows only enter once. */
  hiddenUntilFound: true;
};

export type TestResultsApi = Omit<StepApi, "expand" | "collapse"> & {
  /**
   * With an id, opens that suite, or that failed test and its suite; returns `false` for anything else, or a refused
   * change. Without one, opens the step.
   */
  expand: (id?: string) => boolean;
  /** With an id, closes that suite or failed test; returns `false` for anything else. Without one, closes the step. */
  collapse: (id?: string) => boolean;
  /** The `suites`. */
  getSuites: () => TestSuite[];
  /** Which tests show. */
  getFilter: () => TestResultsFilter;
  /** Shows every test, or those that failed (`"fail"`), passed (`"pass"`) or were skipped (`"skip"`). */
  setFilter: (filter: TestResultsFilter) => boolean;
  /** The open suites and failed tests. */
  getExpanded: () => string[];
  /** Opens exactly these suites and failed tests. Returns `false` when one isn't either, or for a refused change. */
  setExpanded: (values: string[]) => boolean;
  /**
   * Shows only the tests with `status`, opening the step, or every test when they already show, as a press on a count
   * does. Called by the count slot. The step opens with reason `"trigger-press"`, as a press on the header does.
   */
  pressCount: (status: TestCase["status"], event?: Event) => void;
  /** Reports what a person opened or closed. Called as presses, keys and find in page bubble to the tree part. */
  readTree: (event: Event) => void;
  /** Writes the open rows into the Tree once it has attached the controller. */
  syncTree: () => void;
  /** Hands the Tree its props. Called by the tree slot. */
  treeState: (state: TestResultsState) => TestResultsTreeState;
};

type ItemProps = { value: string };
type CountProps = { value: TestCase["status"] };
type ItemPartProps = { value?: string };

type Slot<
  Props extends object = BaseSlotProps,
  Public extends object = Record<never, never>,
> = SlotDefinition<TestResultsState, TestResultsApi, Props, Public>;

type TestResultsSlots = {
  root: Slot;
  trigger: Slot;
  icon: Slot;
  title: Slot<BaseSlotProps, { title: string }>;
  meta: Slot<BaseSlotProps, { counts: TestCounts; duration: string }>;
  content: Slot;
  filter: Slot;
  count: Slot<CountProps & BaseSlotProps, TestResultsCountState>;
  tree: Slot<BaseSlotProps, TestResultsTreeState>;
  item: Slot<ItemProps & BaseSlotProps, TestResultsRow>;
  "item-status": Slot<ItemPartProps & BaseSlotProps>;
  failure: Slot<ItemProps & BaseSlotProps, TestResultsFailureState>;
  empty: Slot<BaseSlotProps, { text: string }>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type TestResultsPrimitive = ReturnType<
  typeof definePrimitive<TestResultsOptions, TestResultsState, TestResultsApi, TestResultsSlots>
>;

const FILTERS: { value: TestResultsFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "fail", label: "Failed" },
  { value: "pass", label: "Passed" },
  { value: "skip", label: "Skipped" },
];
const WORDS: Record<TestCase["status"], string> = { pass: "passed", fail: "failed", skip: "skipped" };
// Status mark statuses: a skipped test draws as the minus `status-mark.css` gives `skipped`.
const MARKS: Record<TestCase["status"], string> = { pass: "complete", fail: "error", skip: "skipped" };

// The keys UI SDK's Tree handles on a row, besides typeahead. Space only checks or selects, which this tree doesn't.
const TREE_KEYS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End", "*", "Enter"]);

const noSuites: TestSuite[] = [];
const noRow: TestResultsRow = {
  name: "",
  suite: false,
  status: "pass",
  duration: "",
  message: "",
  stack: undefined,
};

const formatDuration = (ms: number | undefined) => {
  if (ms === undefined) return "";
  const whole = Math.round(ms);
  return whole < 1000 ? `${whole} ms` : `${(ms / 1000).toFixed(1)} s`;
};

const totalMs = (tests: readonly TestCase[]) =>
  tests.some((test) => test.durationMs !== undefined)
    ? tests.reduce((total, test) => total + (test.durationMs ?? 0), 0)
    : undefined;

const testRow = (test: TestCase): TestResultsRow => ({
  name: test.name,
  suite: false,
  status: testStatus(test),
  duration: formatDuration(test.durationMs),
  message: test.error?.message ?? "",
  stack: test.error?.stack,
});

const suiteRow = (suite: TestSuite): TestResultsRow => ({
  ...noRow,
  name: suite.name,
  suite: true,
  status: suite.tests.some((test) => testStatus(test) === "fail")
    ? "fail"
    : suite.tests.length > 0 && suite.tests.every((test) => testStatus(test) === "skip")
      ? "skip"
      : "pass",
  duration: formatDuration(totalMs(suite.tests)),
});

const testRows = new WeakMap<TestCase, TestResultsRow>();
const suiteRows = new WeakMap<TestSuite, TestResultsRow>();
const rowsCache = new WeakMap<TestSuite[], Record<string, TestResultsRow>>();
const itemsCache = new WeakMap<TestSuite[], Partial<Record<TestResultsFilter, TreeItemData[]>>>();
const suiteItems = new WeakMap<TestSuite, Partial<Record<TestResultsFilter, TreeItemData | null>>>();
const branchesCache = new WeakMap<TestSuite[], Map<string, string | null>>();

// A row keeps its object while the host keeps its suite or test, so only a changed row's parts have new state.
const rowsOf = (suites: TestSuite[]) =>
  cached(rowsCache, suites, () => {
    const rows: Record<string, TestResultsRow> = {};
    // Defined rather than assigned, so a suite whose id is `__proto__` gets its own row.
    const add = (value: string, row: TestResultsRow) =>
      Object.defineProperty(rows, value, {
        value: row,
        enumerable: true,
        writable: true,
        configurable: true,
      });
    for (const suite of suites) {
      add(suite.id, cached(suiteRows, suite, suiteRow));
      for (const test of suite.tests) add(testValue(suite, test), cached(testRows, test, testRow));
    }
    return rows;
  });

// A suite's item keeps its object while the host keeps the suite, so React skips the rows of suites that didn't change.
const suiteItem = (suite: TestSuite, filter: TestResultsFilter) => {
  const byFilter = cached(
    suiteItems,
    suite,
    (): Partial<Record<TestResultsFilter, TreeItemData | null>> => ({}),
  );
  byFilter[filter] ??= testItems([suite], filter)[0] ?? null;
  return byFilter[filter];
};

const itemsOf = (suites: TestSuite[], filter: TestResultsFilter) => {
  const byFilter = cached(itemsCache, suites, (): Partial<Record<TestResultsFilter, TreeItemData[]>> => ({}));
  byFilter[filter] ??= suites.flatMap((suite) => suiteItem(suite, filter) ?? []);
  return byFilter[filter];
};

/** Every suite and failed test, which open and close, each with the suite it's in (`null` for a suite). */
const branchesOf = (suites: TestSuite[]) =>
  cached(branchesCache, suites, () => {
    const branches = new Map<string, string | null>();
    for (const item of itemsOf(suites, "all")) {
      branches.set(item.value, null);
      for (const child of treeValues(item.children ?? []).branches) branches.set(child, item.value);
    }
    return branches;
  });

/** The suites and tests that failed: what opens by default, and what opens when it starts failing. */
const failing = (suites: TestSuite[]) =>
  suites.flatMap((suite) => {
    const failed = suite.tests.filter((test) => testStatus(test) === "fail");
    return failed.length === 0 ? [] : [suite.id, ...failed.map((test) => testValue(suite, test))];
  });

const rowAt = ({ rows }: TestResultsState, value: string) =>
  Object.hasOwn(rows, value) ? (rows[value] as TestResultsRow) : noRow;
const fromItem = { value: { kind: "string", from: "item" } } as const;

/** A row's parts hear only about their own row. */
const own = selects<TestResultsState, TestResultsApi, ItemPartProps>({
  rows: ({ key }) => [key],
  suites: [],
  counts: [],
  duration: [],
  filter: [],
  expanded: [],
});

/** The counts render again only when a count or the filter changes. */
const countParts = selects<TestResultsState, TestResultsApi, CountProps>({
  rows: [],
  suites: [],
  duration: [],
  expanded: [],
});

const sameValues = (a: readonly string[], b: readonly string[]) => {
  const wanted = new Set(b);
  return new Set(a).size === wanted.size && a.every((value) => wanted.has(value));
};

const statusOf = ({ status, suites = noSuites }: TestResultsOptions): StepStatus => {
  if (status) return status;
  const counts = testCounts(suites);
  return counts.fail > 0 ? "error" : counts.total > 0 ? "complete" : "pending";
};

const presentation = ({ suites = noSuites, label, durationSeconds }: TestResultsOptions) => {
  const tests = suites.flatMap((suite) => suite.tests);
  return {
    suites,
    title: label ?? "Tests",
    counts: testCounts(suites),
    duration: formatDuration(durationSeconds === undefined ? totalMs(tests) : durationSeconds * 1000),
    rows: rowsOf(suites),
  };
};

const countsText = ({ pass, fail, skip }: TestCounts) => `${pass} passed, ${fail} failed, ${skip} skipped`;

const base = stepBase<TestResultsState, TestResultsApi, TestResultsOptions>({
  kind: "test-results",
  status: statusOf,
  announcement: (status, title, state) => {
    const outcome = stepAnnouncement(status, title);
    return outcome && `${outcome}, ${countsText(state.counts)}`;
  },
});

export const testResultsPrimitive: TestResultsPrimitive = definePrimitive<
  TestResultsOptions,
  TestResultsState,
  TestResultsApi,
  TestResultsSlots
>({
  name: "kind-test-results",
  ...base,
  options: {
    ...base.options,
    suites: "value",
    filter: "string",
    defaultFilter: "string",
    onFilterChange: "callback",
    expanded: "value",
    defaultExpanded: "value",
    onExpandedChange: "callback",
  },
  state: (options) => ({
    ...base.state(options),
    ...presentation(options),
    filter: knownFilter(options.filter ?? options.defaultFilter ?? "all"),
    expanded: options.expanded ?? options.defaultExpanded ?? failing(options.suites ?? noSuites),
  }),
  sync: (options) => ({
    ...base.sync(options),
    ...presentation(options),
    ...(options.filter === undefined ? {} : { filter: knownFilter(options.filter) }),
    ...(options.expanded === undefined ? {} : { expanded: options.expanded }),
  }),
  controlled: [...base.controlled, "filter", "expanded"],
  api: (context) => {
    const { store } = context;
    const step = base.api(context);
    // `createChange` reads change reasons from the options type, which `context` widens.
    const change = createChange(context as PrimitiveContext<TestResultsOptions, TestResultsState, string>);
    const treeController = createTreeController();
    const initial = store.get();
    let resync = 0;
    context.onDestroy(() => {
      if (resync) cancelAnimationFrame(resync);
    });

    // A suite or test that starts failing opens, so a live run shows its failures as they come, and one that's
    // gone closes, so `expanded` only holds rows that can be closed again.
    let read = initial.suites;
    let failed = new Set(failing(read));
    context.onOptions(({ suites = noSuites }) => {
      if (suites === read) return;
      read = suites;
      const now = failing(suites);
      const started = now.filter((value) => !failed.has(value));
      failed = new Set(now);
      const branches = branchesOf(suites);
      const { expanded } = store.get();
      const next = [
        ...expanded.filter((value) => branches.has(value)),
        ...started.filter((value) => !expanded.includes(value)),
      ];
      if (!sameValues(next, expanded)) change("expanded", next, { reason: "auto", source: "programmatic" });
    });

    const syncTree = () => {
      const { expanded } = store.get();
      // The controller reads `undefined` until the Tree attaches it.
      const shown = treeController.getExpanded();
      if (shown !== undefined && !sameValues(shown, expanded)) treeController.setExpanded(expanded);
    };
    store.subscribe(syncTree);
    // A change the owner cancels is written back, and so is one a controlling owner didn't take by the next frame:
    // the Tree holds its own open rows.
    const settle = (accepted: boolean, controlled: boolean) => {
      if (!accepted) syncTree();
      else if (controlled) {
        cancelAnimationFrame(resync);
        resync = requestAnimationFrame(syncTree);
      }
    };

    const isBranch = (value: string) => branchesOf(store.get().suites).has(value);
    const setExpanded = (expanded: string[]) =>
      sameValues(expanded, store.get().expanded) || change("expanded", expanded, { reason: "imperative" });

    const treeState = memo(
      (label: string, items: TreeItemData[]): TestResultsTreeState => ({
        controller: treeController,
        items,
        defaultExpanded: initial.expanded,
        "aria-label": label,
        mode: "none",
        hiddenUntilFound: true,
      }),
    );

    return {
      ...step,
      expand: (id) => {
        if (id === undefined) return step.expand();
        const suite = branchesOf(store.get().suites).get(id);
        if (suite === undefined) return false;
        return setExpanded([...new Set([...store.get().expanded, ...(suite ? [suite] : []), id])]);
      },
      collapse: (id) => {
        if (id === undefined) return step.collapse();
        return isBranch(id) && setExpanded(store.get().expanded.filter((open) => open !== id));
      },
      getSuites: () => store.get().suites,
      getFilter: () => store.get().filter,
      setFilter: (filter) => {
        if (!FILTERS.some((level) => level.value === filter)) return false;
        return filter === store.get().filter || change("filter", filter, { reason: "imperative" });
      },
      getExpanded: () => store.get().expanded,
      setExpanded: (values) => values.every(isBranch) && setExpanded(values),
      pressCount: (status, event) => {
        const next = store.get().filter === status ? "all" : status;
        if (!change("filter", next, { reason: "item-press", ...(event ? { event } : {}) }) || next === "all")
          return;
        if (!step.isOpen()) step.setOpen(true, { reason: "trigger-press", event });
      },
      readTree: (event) => {
        const expanded = treeController.getExpanded();
        if (expanded === undefined || sameValues(expanded, store.get().expanded)) return;
        const key = event instanceof KeyboardEvent ? event.key : undefined;
        const reason =
          event.type === "beforematch"
            ? "find-in-page"
            : event.type === "click" || key === "Enter"
              ? "item-press"
              : "list-navigation";
        const accepted = change("expanded", expanded, { reason, event });
        settle(accepted, context.options().expanded !== undefined);
      },
      syncTree,
      treeState: (state) => treeState(state.title, itemsOf(state.suites, state.filter)),
    };
  },
  slots: (slot) => {
    const { root, trigger, icon, title, meta, content } = base.slots(slot);
    return {
      root,
      trigger,
      icon,
      title: slot<BaseSlotProps, { title: string }>({ ...title, state: ({ title }) => ({ title }) }),
      meta: slot<BaseSlotProps, { counts: TestCounts; duration: string }>({
        ...meta,
        state: ({ counts, duration }) => ({ counts, duration }),
      }),
      content,
      // The counts, beside the trigger: pressing one shows only its tests, and pressing it again shows every test.
      filter: slot({ attrs: () => ({ "data-test-results-part": "filter" }) }),
      count: slot<CountProps & BaseSlotProps, TestResultsCountState>({
        role: "button",
        focus: "native",
        props: { value: "string" },
        selects: countParts,
        state: (state, { props }) => {
          const count = state.counts[props.value] ?? 0;
          return { count, text: `${count} ${WORDS[props.value]}` };
        },
        press: ({ api, props }, event) => api.pressCount(props.value, event),
        attrs: (state, { props }) => ({
          type: "button",
          "aria-pressed": state.filter === props.value ? "true" : "false",
          "data-kind-button": "",
          "data-kind-size": "sm",
          "data-test-results-count": props.value,
          "data-zero": state.counts[props.value] === 0 ? "" : undefined,
        }),
      }),
      tree: slot<BaseSlotProps, TestResultsTreeState>({
        state: (state, { api }) => api.treeState(state),
        attrs: (state) => ({
          "data-test-results-part": "tree",
          "data-motion": state.motion,
          // An empty tree has no rows, which a `tree` needs: the empty part shows instead.
          hidden: itemsOf(state.suites, state.filter).length === 0 ? "" : undefined,
        }),
        // UI SDK's Tree reports its changes only through callbacks, which web fires as events that don't bubble, so
        // the part reads the Tree's controller as the press, key or find in page that changed it bubbles here.
        on: {
          click: (event, { api }) => api.readTree(event),
          keyup: (event, { api }) => api.readTree(event),
          beforematch: (event, { api }) => api.readTree(event),
        },
        bind: (_el, { api }) => api.syncTree(),
      }),
      item: slot<ItemProps & BaseSlotProps, TestResultsRow>({
        props: { value: "string" },
        selects: own,
        state: (state, { key }) => rowAt(state, key),
        attrs: (state, { key }) => {
          const row = rowAt(state, key);
          return {
            "data-test-results-part": "item",
            "data-kind": row.suite ? "suite" : "test",
            "data-status": row.status,
            "data-duration": row.duration || undefined,
            "data-motion": state.motion,
          };
        },
      }),
      // After the name in the page, so a row's name starts with its visible text (WCAG 2.5.3); the stylesheet draws
      // the mark before it. Named by the status, since every status needs words (spec §8).
      "item-status": slot<ItemPartProps & BaseSlotProps>({
        role: "img",
        props: fromItem,
        selects: own,
        attrs: (state, { key }) => {
          const row = rowAt(state, key);
          return {
            "aria-label": WORDS[row.status],
            "data-test-results-part": "status",
            "data-status-mark": "",
            "data-status": MARKS[row.status],
            "data-motion": state.motion,
          };
        },
      }),
      failure: slot<ItemProps & BaseSlotProps, TestResultsFailureState>({
        props: { value: "string" },
        selects: own,
        state: (state, { key }) => {
          const { message, stack } = rowAt(state, key);
          return { message, stack, motion: state.motion };
        },
        attrs: () => ({ "data-test-results-part": "failure" }),
        // UI SDK's Tree handles keys and presses anywhere inside a row, so Enter would toggle the row, not press the
        // trace's button. React hands this the native event, whose `stopPropagation` can't stop React's, so the Tree's
        // keys and presses are cancelled once the trace has had them (spec §2), and Enter presses the button here.
        on: {
          keydown: (event) => {
            const key = event as KeyboardEvent;
            if (key.key === " " || (!TREE_KEYS.has(key.key) && !isTypeaheadKey(key))) return;
            event.preventDefault();
            if (key.key === "Enter" && key.target instanceof HTMLButtonElement) key.target.click();
          },
          click: (event) => event.preventDefault(),
        },
      }),
      empty: slot<BaseSlotProps, { text: string }>({
        present: (state) => itemsOf(state.suites, state.filter).length === 0,
        state: (state) => ({ text: emptyTestsText(state.filter) }),
        attrs: () => ({ "data-test-results-part": "empty" }),
      }),
    };
  },
  // Suites and failed tests are listed by value for `expand` and `collapse`, and the filters for `setFilter`.
  agent: {
    actions: ["setFilter", "expand", "collapse"],
    items: (api: TestResultsApi) => {
      const suites = api.getSuites();
      const rows = rowsOf(suites);
      return [
        ...FILTERS.map((level) => ({ value: level.value, label: `${level.label} tests` })),
        ...[...branchesOf(suites).keys()].map((value) => ({ value, label: rows[value]?.name ?? value })),
      ];
    },
    closed: true,
  },
});
