import type { PlanItem, TaskItem, TestSuite } from "./records.js";
import type { Approval, ToolCall } from "./tool.js";

export type StepStatus = "pending" | "running" | "awaiting-input" | "complete" | "error" | "cancelled";

export interface StepBase {
  id: string;
  status: StepStatus;
  title: string;
  startedAt?: string;
  endedAt?: string;
  error?: { message: string; detail?: unknown };
  children?: Step[];
}

export type Step =
  | (StepBase & { kind: "reasoning"; text: string })
  | (StepBase & { kind: "tool"; call: ToolCall })
  | (StepBase & { kind: "task"; items: TaskItem[] })
  | (StepBase & { kind: "plan"; items: PlanItem[] })
  | (StepBase & { kind: "subagent"; agent: { id: string; name: string } })
  | (StepBase & { kind: "terminal"; command: string; output: string; exitCode?: number; approval?: Approval })
  | (StepBase & { kind: "tests"; suites: TestSuite[] })
  | (StepBase & { kind: "custom"; name: string; data: unknown });
