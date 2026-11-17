import type { TestResultsOptions } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { TestResults } from "../../../../src/react/test-results.js";
import { suites } from "../../shared/test-results.js";

type Row = TestResultsOptions & { id: string };

const recorded: { filters: [string, string][]; expanded: [string[], string][] } = {
  filters: [],
  expanded: [],
};

function Runs({ rows: first }: { rows: Row[] }) {
  const [rows, setRows] = useState(first);
  const set = (id: string, next: Partial<Row>) =>
    setRows((all) => all.map((row) => (row.id === id ? { ...row, ...next } : row)));
  useEffect(() => {
    Object.assign(window, { kindHost: recorded, kindTestResults: { set } });
  }, []);
  return (
    <div className="flex w-[36rem] flex-col gap-3 p-6">
      {rows.map(({ id, ...row }) => (
        <TestResults
          key={id}
          id={id}
          {...row}
          onFilterChange={(filter, details) =>
            recorded.filters.push([filter, `${details.reason}:${details.source}`])
          }
          onExpandedChange={(expanded, details) => recorded.expanded.push([expanded, details.reason])}
        />
      ))}
    </div>
  );
}

const all: Row[] = [
  { id: "results", suites, defaultOpen: true },
  { id: "live", label: "Live run", suites: [], status: "running" },
];

export const cases = { all: () => <Runs rows={all} /> };
