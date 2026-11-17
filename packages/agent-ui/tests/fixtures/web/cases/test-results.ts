import type { TestResultsOptions } from "@kind-ui/agent-ui/core";
import { defineTestResults } from "../../../../src/web/test-results.js";
import { suites } from "../../shared/test-results.js";

type Row = TestResultsOptions & { id: string; refuse?: boolean };

const runs = (rows: Row[]) => (root: HTMLElement) => {
  defineTestResults();
  const recorded: { filters: [string, string][]; expanded: [string[], string][] } = {
    filters: [],
    expanded: [],
  };
  const list = document.createElement("div");
  list.className = "flex w-[36rem] flex-col gap-3 p-6";
  for (const { id, refuse, ...row } of rows) {
    const results = document.createElement("kind-test-results");
    results.id = id;
    Object.assign(results, row);
    results.addEventListener("filterchange", (event) => {
      recorded.filters.push([event.detail.value, `${event.detail.reason}:${event.detail.source}`]);
      if (refuse) event.preventDefault();
    });
    results.addEventListener("expandchange", (event) => {
      recorded.expanded.push([event.detail.value, event.detail.reason]);
      if (refuse) event.preventDefault();
    });
    list.append(results);
  }
  root.append(list);
  const element = (id: string) => root.querySelector(`#${id}`) as HTMLElementTagNameMap["kind-test-results"];
  Object.assign(window, {
    kindHost: recorded,
    kindTestResults: { set: (id: string, next: Partial<Row>) => Object.assign(element(id), next) },
  });
};

const all: Row[] = [
  { id: "results", suites, defaultOpen: true },
  { id: "live", label: "Live run", suites: [], status: "running" },
];

const late = (root: HTMLElement) => {
  runs([])(root);
  const results = document.createElement("kind-test-results");
  results.id = "late";
  results.suites = suites;
  results.defaultOpen = true;
  results.innerHTML = `<kind-test-results-trigger><button><kind-test-results-title></kind-test-results-title></button></kind-test-results-trigger><kind-test-results-content><div data-test-results-panel></div></kind-test-results-content>`;
  root.append(results);
};

export const cases = {
  late,
  all: runs(all),
  refused: runs([{ id: "results", suites, defaultOpen: true, refuse: true }]),
};
