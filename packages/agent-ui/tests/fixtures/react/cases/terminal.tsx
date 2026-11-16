import type { TerminalOptions } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { Terminal } from "../../../../src/react/terminal.js";
import { installRun, manyLines, testRun } from "../../shared/terminal.js";

type Row = TerminalOptions & { id: string };

const recorded: { copies: [string, string][] } = { copies: [] };

function Terminals({ rows: first }: { rows: Row[] }) {
  const [rows, setRows] = useState(first);
  useEffect(() => {
    const update = (id: string, next: (row: Row) => Row) =>
      setRows((all) => all.map((row) => (row.id === id ? next(row) : row)));
    Object.assign(window, {
      kindHost: recorded,
      kindTerminal: {
        set: (id: string, next: Partial<Row>) => update(id, (row) => ({ ...row, ...next })),
        append: (id: string, text: string) =>
          update(id, (row) => ({ ...row, output: (row.output ?? "") + text })),
      },
    });
  }, []);
  return (
    <div className="flex w-[34rem] flex-col gap-3 p-6">
      {rows.map(({ id, ...row }) => (
        <Terminal
          key={id}
          id={id}
          {...row}
          onCopy={(text, details) => void recorded.copies.push([text, details.reason])}
        />
      ))}
    </div>
  );
}

const all: Row[] = [
  { id: "test", command: "npm test", output: testRun, durationSeconds: 4.2 },
  {
    id: "failed",
    command: "npm run lint",
    output: testRun,
    exitCode: 1,
    durationSeconds: 4.2,
    defaultOpen: true,
  },
  { id: "install", command: "npm install", output: installRun, exitCode: 0, durationSeconds: 3 },
];

export const cases = {
  all: () => <Terminals rows={all} />,
  "stream-10": () => <Terminals rows={[{ id: "stream", command: "npm run build", output: manyLines(10) }]} />,
  "stream-1000": () => (
    <Terminals rows={[{ id: "stream", command: "npm run build", output: manyLines(1000) }]} />
  ),
};
