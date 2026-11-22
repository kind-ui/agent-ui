import {
  type TestResultsCountState,
  type TestResultsFailureState,
  type TestResultsRow,
  type TestResultsTreeState,
  testResultsPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import type { TreeItemData } from "@ui-sdk/vue/tree";
import { type Component, defineComponent, h, type PropType, type Slots } from "vue";
import {
  KindTree,
  KindTreeGroup,
  KindTreeItem,
  KindTreeItemIndicator,
  KindTreeItemLabel,
} from "./internal/tree.js";
import { StackTrace } from "./stack-trace.js";

const parts = createParts(testResultsPrimitive, {
  root: "div",
  trigger: "button",
  icon: "span",
  title: "span",
  meta: "span",
  content: "div",
  filter: "div",
  count: "button",
  tree: "div",
  item: "span",
  "item-status": "span",
  failure: "div",
  empty: "p",
});

// Lucide "chevron-right", see THIRD_PARTY_NOTICES.md.
const chevron = () =>
  h(
    "svg",
    {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "aria-hidden": "true",
    },
    [h("path", { d: "m9 18 6-6-6-6", "stroke-linecap": "round", "stroke-linejoin": "round" })],
  );

// A part whose default slot falls back to `fallback` when the caller fills none.
function withDefault<C extends Component>(part: C, name: string, fallback: (scope: never) => unknown): C {
  const Part = defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () => h(part, attrs, { ...slots, default: slots.default ?? fallback } as Slots);
    },
  });
  return Part as unknown as C;
}

export const TestResultsTrigger = parts.Trigger;
export const TestResultsIcon = parts.Icon;
export const TestResultsContent = parts.Content;

/** The `label`, else "Tests", unless you fill its slot. */
export const TestResultsTitle = withDefault(
  parts.Title,
  "TestResultsTitle",
  ({ state }: { state: { title: string } }) => state.title,
);

/** The run's duration, unless you fill its slot. */
export const TestResultsMeta = withDefault(
  parts.Meta,
  "TestResultsMeta",
  ({ state }: { state: { duration: string } }) => state.duration,
);

/**
 * A toggle button for the tests with its `value` (`"pass"`, `"fail"` or `"skip"`): pressing it shows only those, and
 * pressing it again shows every test. "3 passed", unless you fill its slot.
 */
export const TestResultsCount = withDefault(
  parts.Count,
  "TestResultsCount",
  ({ state }: { state: TestResultsCountState }) => state.text,
);

/** Holds the counts beside the trigger: a `TestResultsCount` for passed, failed and skipped, unless you fill its slot. */
export const TestResultsFilter = withDefault(parts.Filter, "TestResultsFilter", () => [
  h(TestResultsCount, { value: "pass" }),
  h(TestResultsCount, { value: "fail" }),
  h(TestResultsCount, { value: "skip" }),
]);

/** A row's status mark, read as its status and duration, like "failed, 12 ms". */
export const TestResultsItemStatus = parts.ItemStatus;

/**
 * A row's name and its status mark, unless you fill its slot. Its `value` is the suite's id or the test's
 * `suiteId/testId`. The duration is drawn after them.
 */
export const TestResultsItem = withDefault(
  parts.Item,
  "TestResultsItem",
  ({ state }: { state: TestResultsRow }) => [
    h("span", { "data-test-results-name": "" }, state.name),
    " ",
    h(TestResultsItemStatus),
  ],
);

/** A failed test's message and stack trace, as a Stack Trace, unless you fill its slot. Its `value` is the test's. */
export const TestResultsFailure = withDefault(
  parts.Failure,
  "TestResultsFailure",
  ({ state }: { state: TestResultsFailureState }) =>
    h(StackTrace, {
      message: state.message || undefined,
      stack: state.stack,
      autoOpen: "never",
      motion: state.motion,
    }),
);

// Every row has an indicator, a passed or skipped test's an empty spacer that lines its name up with the others. It's
// hidden from agents, which hides UI SDK's Tree from them while the rows stay the Test Results'. A row is its own
// component, so it renders again only when core gives its suite a new item, as React's memoized row does.
const Row: Component<{ item: TreeItemData }> = defineComponent({
  name: "TestResultsRow",
  props: { item: { type: Object as PropType<TreeItemData>, required: true } },
  setup(props) {
    return () => {
      const { item } = props;
      return h(KindTreeItem, { value: item.value }, () => [
        h(KindTreeItemLabel, null, () => [
          h(KindTreeItemIndicator, { "data-agent-hidden": "" }, item.children ? chevron : undefined),
          h(TestResultsItem, { value: item.value }),
        ]),
        item.children
          ? h(KindTreeGroup, null, () =>
              item.children?.length
                ? h(TestResultsRows, { items: item.children })
                : h(TestResultsFailure, { value: item.value }),
            )
          : null,
      ]);
    };
  },
});

/** A Tree row for each item: a suite holds its tests, and a failed test its `TestResultsFailure`. */
export const TestResultsRows: Component<{ items: TreeItemData[] }> = defineComponent({
  name: "TestResultsRows",
  props: { items: { type: Array as PropType<TreeItemData[]>, required: true } },
  setup(props) {
    return () => props.items.map((item) => h(Row, { key: item.value, item }));
  },
});

/** The suites and tests as a UI SDK Tree, with a row for each, unless you fill its slot. */
export const TestResultsTree = withDefault(
  parts.Tree,
  "TestResultsTree",
  ({ state }: { state: TestResultsTreeState }) =>
    // The slot's state is a proxy that lists no keys, so the Tree's props are read one by one.
    h(
      KindTree,
      {
        controller: state.controller,
        items: state.items,
        defaultExpanded: state.defaultExpanded,
        "aria-label": state["aria-label"],
        mode: state.mode,
        hiddenUntilFound: state.hiddenUntilFound,
      },
      () => h(TestResultsRows, { items: state.items }),
    ),
);

/** What shows when the filter lets no test through, like "No failed tests", unless you fill its slot. */
export const TestResultsEmpty = withDefault(
  parts.Empty,
  "TestResultsEmpty",
  ({ state }: { state: { text: string } }) => state.text,
);

/**
 * A test run as a step: its duration in the header, its counts beside it, which filter the tests when pressed, over a
 * tree of suites and tests in which a failed test opens to its message and stack trace. A default slot replaces the
 * default parts.
 */
export const TestResults = withDefault(parts.Root, "TestResults", () => [
  h(TestResultsTrigger, null, () => [h(TestResultsIcon), h(TestResultsTitle), h(TestResultsMeta)]),
  h(TestResultsFilter),
  h(TestResultsContent, null, () =>
    h("div", { "data-test-results-panel": "" }, [h(TestResultsTree), h(TestResultsEmpty)]),
  ),
]);
