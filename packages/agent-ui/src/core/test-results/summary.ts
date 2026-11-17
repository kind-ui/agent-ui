import type { TreeItemData } from "@ui-sdk/core";
import type { TestCase, TestSuite } from "../../types/index.js";

/** Which tests show: every test, or those that failed, passed or were skipped. */
export type TestResultsFilter = "all" | TestCase["status"];

/** How many tests passed, failed and were skipped, and how many there are. */
export type TestCounts = { pass: number; fail: number; skip: number; total: number };

const STATUSES = new Set<string>(["pass", "fail", "skip"]);

/** A test's status, read as `"skip"` when it's none of `"pass"`, `"fail"` and `"skip"`, like a reporter's `"passed"`. */
export const testStatus = (test: TestCase): TestCase["status"] =>
  STATUSES.has(test.status) ? test.status : "skip";

/** How many tests passed, failed and were skipped across the suites. */
export const testCounts = (suites: readonly TestSuite[]): TestCounts => {
  const counts = { pass: 0, fail: 0, skip: 0, total: 0 };
  for (const suite of suites) {
    for (const test of suite.tests) {
      counts[testStatus(test)] += 1;
      counts.total += 1;
    }
  }
  return counts;
};

const EMPTY: Record<TestResultsFilter, string> = {
  all: "No tests",
  fail: "No failed tests",
  pass: "No passed tests",
  skip: "No skipped tests",
};

/** What shows when `filter` lets no test through, like "No failed tests". */
export const emptyTestsText = (filter: TestResultsFilter): string => EMPTY[filter];

/** `filter` when it's one of the four, else `"all"`, so a web attribute's typo shows every test. */
export const knownFilter = (filter: string): TestResultsFilter =>
  Object.hasOwn(EMPTY, filter) ? (filter as TestResultsFilter) : "all";

/** A test's value in the tree: its suite's id and its own, as `suiteId/testId`. */
export const testValue = (suite: TestSuite, test: TestCase): string => `${suite.id}/${test.id}`;

/**
 * Tree data for UI SDK's Tree: each suite a branch whose value is its id, holding the tests `filter` lets through,
 * each with the value `suiteId/testId`. A failed test is a branch with no children, which opens to its error. A suite
 * with no test to show is left out.
 */
export const testItems = (suites: readonly TestSuite[], filter: TestResultsFilter): TreeItemData[] =>
  suites.flatMap((suite) => {
    const tests = filter === "all" ? suite.tests : suite.tests.filter((test) => testStatus(test) === filter);
    if (tests.length === 0) return [];
    const children = tests.map((test) => ({
      value: testValue(suite, test),
      label: test.name,
      ...(testStatus(test) === "fail" ? { children: [] } : {}),
    }));
    return [{ value: suite.id, label: suite.name, children }];
  });
