import type { StackTraceOptions } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { StackTrace } from "../../../../src/react/stack-trace.js";
import { assertionStack, typeErrorFrames, typeErrorStack } from "../../shared/stack-trace.js";

type Row = StackTraceOptions & { id: string; openable?: boolean; keepClipboard?: boolean };

const recorded: { copies: [string, string][]; opened: [number, string, string][] } = {
  copies: [],
  opened: [],
};

function StackTraces({ rows: first }: { rows: Row[] }) {
  const [rows, setRows] = useState(first);
  useEffect(() => {
    Object.assign(window, {
      kindHost: recorded,
      kindStackTrace: {
        set: (id: string, next: Partial<Row>) =>
          setRows((all) => all.map((row) => (row.id === id ? { ...row, ...next } : row))),
      },
    });
  }, []);
  return (
    <div className="flex w-[36rem] flex-col gap-3 p-6">
      {rows.map(({ id, openable, keepClipboard, ...row }) => (
        <StackTrace
          key={id}
          id={id}
          {...row}
          onCopy={(text, details) => {
            recorded.copies.push([text, details.reason]);
            if (keepClipboard) details.cancel();
          }}
          {...(openable && {
            onOpenFrame: (frame, details) =>
              recorded.opened.push([details.index, frame.fn ?? "", `${details.reason}:${details.source}`]),
          })}
        />
      ))}
    </div>
  );
}

const all: Row[] = [
  { id: "stack", stack: typeErrorStack, openable: true },
  { id: "frames", label: "TypeError from frames", frames: typeErrorFrames },
  { id: "assertion", stack: assertionStack, defaultOpen: false },
];

const owned: Row[] = [{ id: "held", stack: typeErrorStack, showLibraryFrames: false, keepClipboard: true }];

export const cases = {
  all: () => <StackTraces rows={all} />,
  owned: () => <StackTraces rows={owned} />,
};
