import {
  type TestResultsCountState,
  type TestResultsFailureState,
  type TestResultsRow,
  type TestResultsTreeState,
  testResultsPrimitive,
} from "@kind-ui/agent-ui/core";
import type { ComponentProps } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import type { TreeItemData } from "@ui-sdk/solid/tree";
import { For, omit, Show } from "solid-js";
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
const Chevron = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <path d="m9 18 6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
);

export type TestResultsProps = ComponentProps<typeof parts.Root>;

/**
 * A test run as a step: its duration in the header, its counts beside it, which filter the tests when pressed, over a
 * tree of suites and tests in which a failed test opens to its message and stack trace. Any `children` replace the
 * default parts.
 */
export function TestResults(props: TestResultsProps) {
  return <parts.Root {...omit(props, "children")}>{props.children ?? <DefaultParts />}</parts.Root>;
}

export const TestResultsTrigger = parts.Trigger;
export const TestResultsIcon = parts.Icon;
export const TestResultsContent = parts.Content;

export type TestResultsTitleProps = ComponentProps<typeof parts.Title>;

/** The `label`, else "Tests", unless you pass children. */
export function TestResultsTitle(props: TestResultsTitleProps) {
  return (
    <parts.Title {...omit(props, "children")}>
      {props.children ?? ((state: { title: string }) => state.title)}
    </parts.Title>
  );
}

export type TestResultsMetaProps = ComponentProps<typeof parts.Meta>;

/** The run's duration, unless you pass children. */
export function TestResultsMeta(props: TestResultsMetaProps) {
  return (
    <parts.Meta {...omit(props, "children")}>
      {props.children ?? ((state: { duration: string }) => state.duration)}
    </parts.Meta>
  );
}

export type TestResultsFilterProps = ComponentProps<typeof parts.Filter>;

/** Holds the counts beside the trigger: a `TestResultsCount` for passed, failed and skipped, unless you pass children. */
export function TestResultsFilter(props: TestResultsFilterProps) {
  return (
    <parts.Filter {...omit(props, "children")}>
      {props.children ?? (
        <>
          <TestResultsCount value="pass" />
          <TestResultsCount value="fail" />
          <TestResultsCount value="skip" />
        </>
      )}
    </parts.Filter>
  );
}

export type TestResultsCountProps = ComponentProps<typeof parts.Count>;

/**
 * A toggle button for the tests with its `value` (`"pass"`, `"fail"` or `"skip"`): pressing it shows only those, and
 * pressing it again shows every test. "3 passed", unless you pass children.
 */
export function TestResultsCount(props: TestResultsCountProps) {
  return (
    <parts.Count {...omit(props, "children")}>
      {props.children ?? ((state: TestResultsCountState) => state.text)}
    </parts.Count>
  );
}

export type TestResultsTreeProps = ComponentProps<typeof parts.Tree>;

/** The suites and tests as a UI SDK Tree, with a row for each, unless you pass children. */
export function TestResultsTree(props: TestResultsTreeProps) {
  return (
    <parts.Tree {...omit(props, "children")}>
      {props.children ??
        ((tree: TestResultsTreeState) => (
          <KindTree
            controller={tree.controller}
            items={tree.items}
            defaultExpanded={tree.defaultExpanded}
            aria-label={tree["aria-label"]}
            mode={tree.mode}
            hiddenUntilFound={tree.hiddenUntilFound}
          >
            <TestResultsRows items={tree.items} />
          </KindTree>
        ))}
    </parts.Tree>
  );
}

// Every row has an indicator, a passed or skipped test's an empty spacer that lines its name up with the others. It's
// hidden from agents, which hides UI SDK's Tree from them while the rows stay the Test Results'.
export type TestResultsRowsProps = { items: TreeItemData[] };

/**
 * A Tree row for each item: a suite holds its tests, and a failed test its `TestResultsFailure`. Rows are keyed by
 * value over the items core keeps while the host keeps its suite, so a streamed test updates only its suite's rows.
 */
export function TestResultsRows(props: TestResultsRowsProps) {
  return (
    <For each={props.items} keyed={(item) => item.value}>
      {(item) => (
        <KindTreeItem value={item().value}>
          <KindTreeItemLabel>
            <KindTreeItemIndicator data-agent-hidden="">
              <Show when={item().children}>
                <Chevron />
              </Show>
            </KindTreeItemIndicator>
            <TestResultsItem value={item().value} />
          </KindTreeItemLabel>
          <Show when={item().children}>
            {(children) => (
              <KindTreeGroup>
                <Show when={children().length > 0} fallback={<TestResultsFailure value={item().value} />}>
                  <TestResultsRows items={children()} />
                </Show>
              </KindTreeGroup>
            )}
          </Show>
        </KindTreeItem>
      )}
    </For>
  );
}

export type TestResultsItemProps = ComponentProps<typeof parts.Item>;

/**
 * A row's name and its status mark, unless you pass children. Its `value` is the suite's id or the test's
 * `suiteId/testId`. The duration is drawn after them.
 */
export function TestResultsItem(props: TestResultsItemProps) {
  return (
    <parts.Item {...omit(props, "children")}>
      {props.children ??
        ((row: TestResultsRow) => (
          <>
            <span data-test-results-name="">{row.name}</span> <TestResultsItemStatus />
          </>
        ))}
    </parts.Item>
  );
}

export type TestResultsItemStatusProps = ComponentProps<typeof parts.ItemStatus>;

/** A row's status mark, read as its status and duration, like "failed, 12 ms". */
export function TestResultsItemStatus(props: TestResultsItemStatusProps) {
  return <parts.ItemStatus {...props} />;
}

export type TestResultsFailureProps = ComponentProps<typeof parts.Failure>;

/** A failed test's message and stack trace, as a Stack Trace, unless you pass children. Its `value` is the test's. */
export function TestResultsFailure(props: TestResultsFailureProps) {
  return (
    <parts.Failure {...omit(props, "children")}>
      {props.children ??
        ((state: TestResultsFailureState) => (
          <StackTrace
            message={state.message || undefined}
            stack={state.stack}
            autoOpen="never"
            motion={state.motion}
          />
        ))}
    </parts.Failure>
  );
}

export type TestResultsEmptyProps = ComponentProps<typeof parts.Empty>;

/** What shows when the filter lets no test through, like "No failed tests", unless you pass children. */
export function TestResultsEmpty(props: TestResultsEmptyProps) {
  return (
    <parts.Empty {...omit(props, "children")}>
      {props.children ?? ((state: { text: string }) => state.text)}
    </parts.Empty>
  );
}

function DefaultParts() {
  return (
    <>
      <TestResultsTrigger>
        <TestResultsIcon />
        <TestResultsTitle />
        <TestResultsMeta />
      </TestResultsTrigger>
      <TestResultsFilter />
      <TestResultsContent>
        <div data-test-results-panel="">
          <TestResultsTree />
          <TestResultsEmpty />
        </div>
      </TestResultsContent>
    </>
  );
}
