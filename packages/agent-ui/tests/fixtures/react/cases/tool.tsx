import type { ToolCall } from "@kind-ui/agent-ui";
import type { ToolOptions } from "@kind-ui/agent-ui/core";
import { memo, useEffect, useState } from "react";
import { Tool } from "../../../../src/react/tool.js";

type Row = Pick<ToolOptions, "status" | "error" | "motion" | "label"> & { call: ToolCall };

const call = (name: string, fields: Partial<ToolCall> = {}): ToolCall => ({
  toolCallId: name,
  name,
  dynamic: false,
  input: { state: "ready", value: { query: "steps" } },
  ...fields,
});

const initial: Record<string, Row> = {
  search: { call: call("search_docs", { input: { state: "streaming", value: { query: "ste" } } }) },
  read: { call: call("read_file", { input: { state: "ready", value: { path: "README.md" } } }) },
  run: { call: call("run_tests") },
  approve: {
    call: call("delete_file", { approval: { approvalId: "a1", generation: 1, state: "requested" } }),
  },
  done: { call: call("summarize", { output: { state: "available", value: "Found **3** results." } }) },
  failed: {
    call: call("fetch_url", { outcome: "error" }),
    error: { message: "Request timed out after 30 s." },
  },
};

const many = (size: number) =>
  Object.fromEntries(Array.from({ length: size }, (_, i) => [`tool-${i}`, { call: call(`tool_${i}`) }]));

const ToolRow = memo(function ToolRow({ id, row }: { id: string; row: Row }) {
  return <Tool id={id} {...row} />;
});

function Tools({ rows: first }: { rows: Record<string, Row> }) {
  const [rows, setRows] = useState(first);
  useEffect(() => {
    const update = (id: string, next: (row: Row) => Row) =>
      setRows((all) => ({ ...all, [id]: next(all[id] as Row) }));
    Object.assign(window, {
      kindTool: {
        set: (id: string, next: Partial<Row>) => update(id, (row) => ({ ...row, ...next })),
        setCall: (id: string, next: Partial<ToolCall>) =>
          update(id, (row) => ({ ...row, call: { ...row.call, ...next } })),
      },
    });
  }, []);
  return (
    <div className="flex w-[28rem] flex-col gap-2 p-6">
      {Object.entries(rows).map(([id, row]) => (
        <ToolRow key={id} id={id} row={row} />
      ))}
    </div>
  );
}

export const cases = {
  all: () => <Tools rows={initial} />,
  "many-10": () => <Tools rows={many(10)} />,
  "many-500": () => <Tools rows={many(500)} />,
};
