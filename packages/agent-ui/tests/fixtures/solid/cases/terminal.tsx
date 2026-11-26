import type { TerminalOptions } from "@kind-ui/agent-ui/core";
import { createSignal, For, onSettled } from "solid-js";
import { Terminal } from "../../../../src/solid/terminal.js";
import { confirmationHost } from "../../shared/confirmation.js";
import { expose } from "../../shared/expose.js";
import { approvalTerminals, installRun, manyLines, testRun } from "../../shared/terminal.js";

type Row = TerminalOptions & { id: string; keepClipboard?: boolean };

const recorded: { copies: [string, string][] } = { copies: [] };

function Terminals(props: { rows: Row[] }) {
  const [rows, setRows] = createSignal(props.rows);
  onSettled(() => {
    const update = (id: string, next: (row: Row) => Row) => {
      setRows((all) => all.map((row) => (row.id === id ? next(row) : row)));
    };
    expose({
      kindHost: recorded,
      kindTerminal: {
        set: (id: string, next: Partial<Row>) => update(id, (row) => ({ ...row, ...next })),
        append: (id: string, text: string) =>
          update(id, (row) => ({ ...row, output: (row.output ?? "") + text })),
      },
    });
  });
  return (
    <div class="flex w-[34rem] flex-col gap-3 p-6">
      <For each={rows()} keyed={(row) => row.id}>
        {(row) => (
          <Terminal
            id={row().id}
            command={row().command}
            label={row().label}
            output={row().output}
            exitCode={row().exitCode}
            durationSeconds={row().durationSeconds}
            defaultOpen={row().defaultOpen}
            open={row().open}
            onCopy={(text, details) => {
              recorded.copies.push([text, details.reason]);
              if (row().keepClipboard) details.cancel();
            }}
          />
        )}
      </For>
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
  const { host, approve, deny, always } = confirmationHost();
  const [rows, setRows] = createSignal(approvalTerminals());
  onSettled(() =>
    expose({
      kindHost: host,
      kindTerminal: {
        set: (id: string, next: Partial<TerminalOptions>) =>
          setRows((all) =>
            all.map((row) => (row.id === id ? { ...row, options: { ...row.options, ...next } } : row)),
          ),
      },
    }),
  );
  return (
    <div class="flex w-full max-w-[40rem] flex-col gap-4 p-6">
      <For each={rows()} keyed={(row) => row.id}>
        {(row) => (
          <Terminal
            id={row().id}
            command={row().options.command}
            approval={row().options.approval}
            alwaysTarget={row().options.alwaysTarget}
            alwaysScope={row().options.alwaysScope}
            alwaysDetail={row().options.alwaysDetail}
            risk={row().options.risk}
            riskText={row().options.riskText}
            output={row().options.output}
            exitCode={row().options.exitCode}
            durationSeconds={row().options.durationSeconds}
            defaultOpen={row().options.defaultOpen}
            onApprove={approve}
            onDeny={deny}
            onAlwaysAllow={always}
          />
        )}
      </For>
    </div>
  );
}

export const cases = {
  approval: () => <Approvals />,
  all: () => <Terminals rows={all} />,
  owned: () => <Terminals rows={owned} />,
  "stream-10": () => <Terminals rows={[{ id: "stream", command: "npm run build", output: manyLines(10) }]} />,
  "stream-1000": () => (
    <Terminals rows={[{ id: "stream", command: "npm run build", output: manyLines(1000) }]} />
  ),
};
