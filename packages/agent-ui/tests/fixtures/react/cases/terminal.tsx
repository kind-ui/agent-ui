import type { TerminalOptions } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { Terminal } from "../../../../src/react/terminal.js";
import { Tool } from "../../../../src/react/tool.js";
import { confirmationHost } from "../../shared/confirmation.js";
import { approvalCall, approvalRuns, installRun, manyLines, testRun } from "../../shared/terminal.js";

type Row = TerminalOptions & { id: string; keepClipboard?: boolean };

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
      {rows.map(({ id, keepClipboard, ...row }) => (
        <Terminal
          key={id}
          id={id}
          {...row}
          onCopy={(text, details) => {
            recorded.copies.push([text, details.reason]);
            if (keepClipboard) details.cancel();
          }}
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

const owned: Row[] = [
  { id: "held", command: "npm run dev", output: installRun, exitCode: 0, open: true, keepClipboard: true },
  { id: "empty", command: "npm run build", output: "" },
];

function Approvals() {
  const [{ host, approve, deny, always }] = useState(confirmationHost);
  const [rows, setRows] = useState<Record<string, Partial<TerminalOptions>>>(() =>
    Object.fromEntries(
      Object.keys(approvalRuns).map((id) => [
        id,
        { approval: { approvalId: id, generation: 1, state: "requested" }, output: "" },
      ]),
    ),
  );
  useEffect(() => {
    Object.assign(window, {
      kindHost: host,
      kindTerminal: {
        set: (id: string, next: Partial<TerminalOptions>) =>
          setRows((all) => ({ ...all, [id]: { ...all[id], ...next } })),
      },
    });
  }, [host]);
  return (
    <div className="flex w-[34rem] flex-col gap-3 p-6">
      <p id="above">Above the terminals</p>
      {Object.entries(approvalRuns).map(([id, run]) => (
        <Terminal
          key={id}
          id={id}
          command={run.command}
          {...rows[id]}
          approvalReason={run.reason}
          onApprove={approve}
          onDeny={deny}
          onAlwaysAllow={run.always ? always : undefined}
        />
      ))}
      <Tool id="tool" call={approvalCall} onApprove={approve} onDeny={deny} onAlwaysAllow={always} />
    </div>
  );
}

export const cases = {
  all: () => <Terminals rows={all} />,
  owned: () => <Terminals rows={owned} />,
  "stream-10": () => <Terminals rows={[{ id: "stream", command: "npm run build", output: manyLines(10) }]} />,
  "stream-1000": () => (
    <Terminals rows={[{ id: "stream", command: "npm run build", output: manyLines(1000) }]} />
  ),
  approval: () => <Approvals />,
};
