import type { ToolCall } from "@kind-ui/agent-ui";
import type { ToolOptions } from "@kind-ui/agent-ui/core";
import { createSignal, For, onSettled } from "solid-js";
import { Tool } from "../../../../src/solid/tool.js";
import { confirmationHost } from "../../shared/confirmation.js";
import { expose } from "../../shared/expose.js";

const { host, approve, deny } = confirmationHost();

type Row = Pick<ToolOptions, "status" | "error" | "motion" | "label" | "onApprove" | "onDeny"> & {
  call: ToolCall;
};

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
    onApprove: approve,
    onDeny: deny,
  },
  done: { call: call("summarize", { output: { state: "available", value: "Found **3** results." } }) },
  failed: {
    call: call("fetch_url", { outcome: "error" }),
    error: { message: "Request timed out after 30 s." },
  },
};

const many = (size: number) =>
  Object.fromEntries(Array.from({ length: size }, (_, i) => [`tool-${i}`, { call: call(`tool_${i}`) }]));

function Tools(props: { rows: Record<string, Row> }) {
  const [rows, setRows] = createSignal(props.rows);
  onSettled(() => {
    const update = (id: string, next: (row: Row) => Row) =>
      setRows((all) => ({ ...all, [id]: next(all[id] as Row) }));
    expose({
      kindHost: host,
      kindTool: {
        set: (id: string, next: Partial<Row>) => update(id, (row) => ({ ...row, ...next })),
        setCall: (id: string, next: Partial<ToolCall>) =>
          update(id, (row) => ({ ...row, call: { ...row.call, ...next } })),
      },
    });
  });
  return (
    <div class="flex w-[28rem] flex-col gap-2 p-6">
      <For each={Object.entries(rows())} keyed={(entry) => entry[0]}>
        {(entry) => (
          <Tool
            id={entry()[0]}
            call={entry()[1].call}
            status={entry()[1].status}
            error={entry()[1].error}
            motion={entry()[1].motion}
            label={entry()[1].label}
            onApprove={entry()[1].onApprove}
            onDeny={entry()[1].onDeny}
          />
        )}
      </For>
    </div>
  );
}

export const cases = {
  all: () => <Tools rows={initial} />,
  "many-10": () => <Tools rows={many(10)} />,
  "many-500": () => <Tools rows={many(500)} />,
};
