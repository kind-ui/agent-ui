import type { ToolCall } from "@kind-ui/agent-ui";
import { defineTool } from "../../../../src/web/tool.js";
import { confirmationHost } from "../../shared/confirmation.js";
import { retryHost, retryRows } from "../../shared/tool-retry.js";

const { host, approve, deny } = confirmationHost();
const { retries, retry } = retryHost();

type Row = Partial<
  Pick<HTMLElementTagNameMap["kind-tool"], "status" | "error" | "motion" | "label" | "retry" | "defaultOpen">
> & {
  call: ToolCall;
  canRetry?: boolean;
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
  const approval = list.querySelector("#approve") as HTMLElementTagNameMap["kind-tool"] | null;
  if (approval) {
    approval.canApprove = true;
    approval.canDeny = true;
    approval.addEventListener("approve", (event) =>
      event.detail.waitUntil(Promise.resolve(approve(event.detail.value, event.detail))),
    );
    approval.addEventListener("deny", (event) =>
      event.detail.waitUntil(Promise.resolve(deny(event.detail.value, event.detail))),
    );
  }
  for (const tool of list.querySelectorAll("kind-tool"))
    tool.addEventListener("toolretry", (event) =>
      event.detail.waitUntil(retry(tool.id)(event.detail.value, event.detail)),
    );
  root.append(list);
  const element = (id: string) => root.querySelector(`#${id}`) as HTMLElementTagNameMap["kind-tool"];
  Object.assign(window, {
    kindHost: host,
    kindRetries: retries,
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
  retry: tools({
    failed: { ...retryRows.failed, canRetry: true },
    other: { ...retryRows.other, canRetry: true },
    retrying: retryRows.retrying,
  }),
  "many-10": tools(many(10)),
  "many-500": tools(many(500)),
};
