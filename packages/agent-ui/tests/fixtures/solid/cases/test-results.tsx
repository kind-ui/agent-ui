import type { TestResultsOptions } from "@kind-ui/agent-ui/core";
import { createSignal, For, onSettled } from "solid-js";
import { TestResults } from "../../../../src/solid/test-results.js";
import { expose } from "../../shared/expose.js";
import { suites } from "../../shared/test-results.js";

type Row = TestResultsOptions & { id: string };

const recorded: { filters: [string, string][]; expanded: [string[], string][] } = {
  filters: [],
  expanded: [],
};

function Runs(props: { rows: Row[] }) {
  const [rows, setRows] = createSignal(props.rows);
  const set = (id: string, next: Partial<Row>) =>
    setRows((all) => all.map((row) => (row.id === id ? { ...row, ...next } : row)));
  onSettled(() => expose({ kindHost: recorded, kindTestResults: { set } }));
  return (
    <div class="flex w-[36rem] flex-col gap-3 p-6">
      <For each={rows()} keyed={(row) => row.id}>
        {(row) => (
          <TestResults
            id={row().id}
            suites={row().suites}
            label={row().label}
            status={row().status}
            defaultOpen={row().defaultOpen}
            filter={row().filter}
            expanded={row().expanded}
            onFilterChange={(filter, details) =>
              recorded.filters.push([filter, `${details.reason}:${details.source}`])
            }
            onExpandedChange={(expanded, details) => recorded.expanded.push([expanded, details.reason])}
          />
        )}
      </For>
    </div>
  );
}

const all: Row[] = [
  { id: "results", suites, defaultOpen: true },
  { id: "live", label: "Live run", suites: [], status: "running" },
];

const refused: Row[] = [
  { id: "results", suites, defaultOpen: true, filter: "all", expanded: ["auth", "auth/bad"] },
];

export const cases = { all: () => <Runs rows={all} />, refused: () => <Runs rows={refused} /> };
