import {
  type Approval,
  hasOutput,
  isToolStep,
  type Message,
  type MessageStatus,
  type Part,
  type PlanItem,
  type Role,
  type Source,
  type Step,
  type StepBase,
  type StepStatus,
  type TaskItem,
  type TestCase,
  type TestSuite,
  type ToolCall,
} from "@kind-ui/agent-ui";

const role: Role = "assistant";
const status: MessageStatus = "streaming";
const stepStatus: StepStatus = "awaiting-input";
const base: StepBase = { id: "b", status: stepStatus, title: "Base" };

const source: Source = { id: "src", title: "Docs", url: "https://example.com" };
const task: TaskItem = { id: "t", title: "Edit", status: "running", files: ["a.ts"] };
const plan: PlanItem = { id: "p", title: "Plan", status: "skipped" };
const testCase: TestCase = { id: "c", name: "works", status: "fail", error: { message: "boom" } };
const suite: TestSuite = { id: "s", name: "suite", tests: [testCase] };
const approval: Approval = { approvalId: "a", generation: 1, state: "auto" };
const call: ToolCall = {
  toolCallId: "tc",
  name: "search",
  dynamic: false,
  input: { state: "ready", value: { q: "x" } },
  output: { state: "available", value: null },
  approval,
};

const steps: Step[] = [
  { ...base, kind: "reasoning", text: "thinking" },
  { ...base, kind: "tool", call },
  { ...base, kind: "task", items: [task] },
  { ...base, kind: "plan", items: [plan] },
  { ...base, kind: "subagent", agent: { id: "ag", name: "Helper" } },
  { ...base, kind: "terminal", command: "ls", output: "", exitCode: 0 },
  { ...base, kind: "tests", suites: [suite] },
  { ...base, kind: "custom", name: "chart", data: { points: [] } },
];

const parts: Part[] = [
  { type: "text", id: "1", text: "hi", state: "done" },
  { type: "source", id: "2", source },
  ...steps.map((step): Part => ({ type: "step", id: step.id, step })),
];

export const message: Message = { id: "m", role, status, parts, createdAt: "2026-11-14T00:00:00Z" };

for (const step of steps) {
  if (isToolStep(step) && hasOutput(step.call)) {
    const value: unknown = step.call.output.value;
    void value;
  }
}

// @ts-expect-error output presence must be narrowed before use
call.output.value;
