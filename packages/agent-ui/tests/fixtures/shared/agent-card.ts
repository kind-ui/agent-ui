import type { AgentInfo } from "@kind-ui/agent-ui";

export const planner: AgentInfo = {
  id: "planner",
  name: "Planner",
  model: "GPT-5",
  description: "Breaks a request into steps and hands each to the agent that fits it.",
  capabilities: ["Planning", "Web search", "Code review"],
};

export const reviewer: AgentInfo = {
  id: "reviewer",
  name: "Code Reviewer",
  model: "Claude Sonnet 4.5",
  description: "Reads a pull request and leaves comments on what to change.",
  capabilities: ["Code review"],
};

export const minimal: AgentInfo = { id: "minimal", name: "Scout" };

export type AgentCardRun = { id: string; reason: string; source: string | undefined };

/** Records each action the cards run, with its reason and source. */
export function agentCardHost() {
  const runs: AgentCardRun[] = [];
  return {
    runs,
    record: (id: string, details: { reason: string; source?: string }) =>
      runs.push({ id, reason: details.reason, source: details.source }),
  };
}
