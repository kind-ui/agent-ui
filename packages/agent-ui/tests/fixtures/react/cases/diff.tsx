import type { DiffOptions, Token } from "@kind-ui/agent-ui/core";
import type { AgentAction } from "@ui-sdk/react/agent";
import { useEffect, useState } from "react";
import { Diff } from "../../../../src/react/diff.js";
import { after, before, longPatch, renamePatch } from "../../shared/diff.js";

type Row = DiffOptions & { id: string; keepClipboard?: boolean; host?: boolean };

const recorded: { copies: [string, string][]; decisions: [string, string][] } = { copies: [], decisions: [] };
const waiting: Record<string, () => void> = {};

const highlight = async (code: string): Promise<Token[]> =>
  code
    .split(/(const)/)
    .map((content) =>
      content === "const"
        ? { content, color: "light-dark(rgb(160, 0, 160), rgb(230, 150, 230))" }
        : { content },
    );

function Diffs({ rows: first }: { rows: Row[] }) {
  const [rows, setRows] = useState(first);
  useEffect(() => {
    const update = (id: string, next: (row: Row) => Row) =>
      setRows((all) => all.map((row) => (row.id === id ? next(row) : row)));
    Object.assign(window, {
      kindHost: recorded,
      kindDiff: {
        set: (id: string, next: Partial<Row>) => update(id, (row) => ({ ...row, ...next })),
        append: (id: string, text: string) =>
          update(id, (row) => ({ ...row, patch: (row.patch ?? "") + text })),
        settle: (name: string) => waiting[name]?.(),
      },
    });
  }, []);
  const decide = (name: string) => (details: { source: string }) => {
    recorded.decisions.push([name, details.source]);
    return new Promise<void>((resolve) => {
      waiting[name] = resolve;
    });
  };
  return (
    <div className="flex w-[40rem] max-w-full flex-col gap-3 p-6">
      {rows.map(({ id, keepClipboard, host, ...row }) => (
        <Diff
          key={id}
          id={id}
          {...row}
          {...(host && { onAccept: decide("accept"), onRevert: decide("revert") })}
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
  { id: "edit", file: { path: "src/values.ts", language: "ts" }, before, after, highlight, host: true },
  { id: "rename", patch: renamePatch, keepClipboard: true },
];

// Revert marks the diff, so an agent's step there needs a person, which a test grants through `kindHost.permit`.
export const allow = (step: AgentAction) =>
  !step.confirm || (window as { kindHost?: { permit?: boolean } }).kindHost?.permit === true;

export const cases = {
  all: () => <Diffs rows={all} />,
  "stream-40": () => <Diffs rows={[{ id: "stream", patch: longPatch(40), streaming: true }]} />,
  "stream-2000": () => <Diffs rows={[{ id: "stream", patch: longPatch(2000), streaming: true }]} />,
};
