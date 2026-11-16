import type { ToolCall } from "@kind-ui/agent-ui";
import { defineTool } from "../../../../src/web/tool.js";

type Row = Partial<Pick<HTMLElementTagNameMap["kind-tool"], "status" | "error" | "motion" | "label">> & {
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
  },
  done: { call: call("summarize", { output: { state: "available", value: "Found **3** results." } }) },
  failed: {
    call: call("fetch_url", { outcome: "error" }),
    error: { message: "Request timed out after 30 s." },
  },
};

const many = (size: number) =>
  Object.fromEntries(Array.from({ length: size }, (_, i) => [`tool-${i}`, { call: call(`tool_${i}`) }]));

const tools = (rows: Record<string, Row>) => (root: HTMLElement) => {
  defineTool();
  const list = document.createElement("div");
  list.className = "flex w-[28rem] flex-col gap-2 p-6";
  for (const [id, row] of Object.entries(rows)) {
    const tool = document.createElement("kind-tool");
    tool.id = id;
    Object.assign(tool, row);
    list.append(tool);
  }
  root.append(list);
  const element = (id: string) => root.querySelector(`#${id}`) as HTMLElementTagNameMap["kind-tool"];
  Object.assign(window, {
    kindTool: {
      set: (id: string, next: Partial<Row>) => Object.assign(element(id), next),
      setCall: (id: string, next: Partial<ToolCall>) => {
        element(id).call = { ...(element(id).call as ToolCall), ...next };
      },
    },
  });
};

export const cases = {
  all: tools(initial),
  "many-10": tools(many(10)),
  "many-500": tools(many(500)),
};
