import type { TestResultsOptions } from "@kind-ui/agent-ui/core";
import { defineTestResults } from "../../../../src/web/test-results.js";
import { suites } from "../../shared/test-results.js";

type Row = TestResultsOptions & { id: string };

const runs = (rows: Row[]) => (root: HTMLElement) => {
  defineTestResults();
  const recorded: { filters: [string, string][]; expanded: [string[], string][] } = {
    filters: [],
    expanded: [],
  };
  const list = document.createElement("div");
  list.className = "flex w-[36rem] flex-col gap-3 p-6";
  for (const { id, ...row } of rows) {
    const results = document.createElement("kind-test-results");
    results.id = id;
    Object.assign(results, row);
    results.addEventListener("filterchange", (event) => {
      recorded.filters.push([event.detail.value, `${event.detail.reason}:${event.detail.source}`]);
    });
    results.addEventListener("expandchange", (event) => {
      recorded.expanded.push([event.detail.value, event.detail.reason]);
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

export const cases = { all: runs(all) };
