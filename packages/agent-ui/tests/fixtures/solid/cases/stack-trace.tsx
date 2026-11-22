import type { StackTraceOptions } from "@kind-ui/agent-ui/core";
import { createSignal, For, onSettled } from "solid-js";
import { StackTrace } from "../../../../src/solid/stack-trace.js";
import { expose } from "../../shared/expose.js";
import { assertionStack, typeErrorFrames, typeErrorStack } from "../../shared/stack-trace.js";

type Row = StackTraceOptions & { id: string; openable?: boolean; keepClipboard?: boolean; accepts?: boolean };

const recorded: {
  copies: [string, string][];
  opened: [number, string, string][];
  shown: [boolean, string][];
} = { copies: [], opened: [], shown: [] };

function StackTraces(props: { rows: Row[] }) {
  const [rows, setRows] = createSignal(props.rows);
  const set = (id: string, next: Partial<Row>) =>
    setRows((all) => all.map((row) => (row.id === id ? { ...row, ...next } : row)));
  onSettled(() => expose({ kindHost: recorded, kindStackTrace: { set } }));
  return (
    <div class="flex w-[36rem] flex-col gap-3 p-6">
      <For each={rows()} keyed={(row) => row.id}>
        {(row) => (
          <StackTrace
            id={row().id}
            stack={row().stack}
            frames={row().frames}
            message={row().message}
            label={row().label}
            defaultOpen={row().defaultOpen}
            showLibraryFrames={row().showLibraryFrames}
            onCopy={(text, details) => {
              recorded.copies.push([text, details.reason]);
              if (row().keepClipboard) details.cancel();
            }}
            onShowLibraryFramesChange={
              row().accepts
                ? (show, details) => {
                    recorded.shown.push([show, details.reason]);
                    set(row().id, { showLibraryFrames: show });
                  }
                : undefined
            }
            onOpenFrame={
              row().openable
                ? (frame, details) =>
                    recorded.opened.push([
                      details.index,
                      frame.fn ?? "",
                      `${details.reason}:${details.source}`,
                    ])
                : undefined
            }
          />
        )}
      </For>
    </div>
  );
}

const all: Row[] = [
  { id: "stack", stack: typeErrorStack, openable: true },
  { id: "frames", label: "TypeError from frames", frames: typeErrorFrames },
  { id: "assertion", stack: assertionStack, defaultOpen: false },
];

const owned: Row[] = [
  { id: "held", stack: typeErrorStack, showLibraryFrames: false, keepClipboard: true },
  { id: "accepted", stack: typeErrorStack, showLibraryFrames: false, accepts: true },
];

export const cases = {
  all: () => <StackTraces rows={all} />,
  owned: () => <StackTraces rows={owned} />,
};
