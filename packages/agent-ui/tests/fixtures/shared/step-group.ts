import type { StepStatus, ToolCall } from "@kind-ui/agent-ui";
import type { StepGroupItem } from "@kind-ui/agent-ui/core";

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

export const toolLabels = {
  read: (count: number) => `read ${plural(count, "file", "files")}`,
  run: (count: number) => `ran ${plural(count, "command", "commands")}`,
};

export const agentLabels = { agent: (count: number) => plural(count, "agent", "agents") };

export type ToolRow = StepGroupItem & { call: ToolCall };

const call = (toolCallId: string, name: string, value: Record<string, string>): ToolCall => ({
  toolCallId,
  name,
  dynamic: false,
  input: { state: "ready", value },
});

/** Two files read and one command still running. */
export const tools: ToolRow[] = [
  {
    id: "read-a",
    group: "read",
    status: "complete",
    call: call("read-a", "read_file", { path: "src/a.ts" }),
  },
  {
    id: "read-b",
    group: "read",
    status: "complete",
    call: call("read-b", "read_file", { path: "src/b.ts" }),
  },
  { id: "run", group: "run", status: "running", call: call("run", "bash", { command: "npm test" }) },
];

/** One command waiting on the person's approval. */
export const approval: ToolRow = {
  id: "delete",
  group: "run",
  status: "awaiting-input",
  call: {
    ...call("delete", "delete_file", { path: "tmp/cache" }),
    approval: { approvalId: "a1", generation: 1, state: "requested" },
  },
};

export type AgentRow = StepGroupItem & { name: string; task: string };

export const agents: AgentRow[] = [
  { id: "reviewer", group: "agent", status: "running", name: "Code reviewer", task: "Reviewing the diff" },
  { id: "writer", group: "agent", status: "running", name: "Docs writer", task: "Updating the guide" },
  { id: "tester", group: "agent", status: "complete", name: "Test runner", task: "Ran 214 tests" },
];

export type StepGroupHost = {
  cancels: { resolve(): void; reject(): void }[];
  approvals: string[];
  /** Sets one item's status, in the `tools` or `agents` group. */
  setStatus(id: string, status: StepStatus): void;
};

export function stepGroupHost() {
  const host = { cancels: [], approvals: [] } as Omit<StepGroupHost, "setStatus">;
  const cancel = () => new Promise<void>((resolve, reject) => host.cancels.push({ resolve, reject }));
  const approve = (_decision: unknown, details: { source: string }) => {
    host.approvals.push(details.source);
  };
  return { host, cancel, approve };
}
