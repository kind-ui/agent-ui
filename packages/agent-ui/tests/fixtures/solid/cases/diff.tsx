import type { DiffOptions, Token } from "@kind-ui/agent-ui/core";
import type { AgentAction } from "@ui-sdk/solid/agent";
import { createSignal, For, onSettled } from "solid-js";
import { Diff } from "../../../../src/solid/diff.js";
import { after, before, longPatch, renamePatch } from "../../shared/diff.js";
import { expose } from "../../shared/expose.js";

type Row = DiffOptions & { id: string; keepClipboard?: boolean; host?: boolean };

const recorded: { copies: [string, string][]; decisions: [string, string][]; permit?: boolean } = {
  copies: [],
  decisions: [],
};
const waiting: Record<string, () => void> = {};

const highlight = async (code: string): Promise<Token[]> =>
  code
    .split(/(const)/)
    .map((content) =>
      content === "const"
        ? { content, color: "light-dark(rgb(160, 0, 160), rgb(230, 150, 230))" }
        : { content },
    );

const decide = (name: string) => (details: { source: string }) => {
  recorded.decisions.push([name, details.source]);
  return new Promise<void>((resolve) => {
    waiting[name] = resolve;
  });
};

// Revert marks the diff, so an agent's step there needs a person, which a test grants through `kindHost.permit`.
export const allow = (step: AgentAction) => !step.confirm || recorded.permit === true;

function Diffs(props: { rows: Row[] }) {
  const [rows, setRows] = createSignal(props.rows);
  onSettled(() => {
    const update = (id: string, next: (row: Row) => Row) => {
      setRows((all) => all.map((row) => (row.id === id ? next(row) : row)));
    };
    expose({
      kindHost: recorded,
      kindDiff: {
        set: (id: string, next: Partial<Row>) => update(id, (row) => ({ ...row, ...next })),
        append: (id: string, text: string) =>
          update(id, (row) => ({ ...row, patch: (row.patch ?? "") + text })),
        settle: (name: string) => waiting[name]?.(),
      },
    });
  });
  return (
    <div class="flex w-[40rem] max-w-full flex-col gap-3 p-6">
      <For each={rows()} keyed={(row) => row.id}>
        {(row) => (
          <Diff
            id={row().id}
            file={row().file}
            patch={row().patch}
            before={row().before}
            after={row().after}
            highlight={row().highlight}
            streaming={row().streaming}
            onAccept={row().host ? decide("accept") : undefined}
            onRevert={row().host ? decide("revert") : undefined}
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
  { id: "edit", file: { path: "src/values.ts", language: "ts" }, before, after, highlight, host: true },
  { id: "rename", patch: renamePatch, keepClipboard: true },
];

export const cases = {
  all: () => <Diffs rows={all} />,
  "stream-40": () => <Diffs rows={[{ id: "stream", patch: longPatch(40), streaming: true }]} />,
  "stream-2000": () => <Diffs rows={[{ id: "stream", patch: longPatch(2000), streaming: true }]} />,
};
