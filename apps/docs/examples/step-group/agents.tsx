import type { StepGroupItem } from "@kind-ui/agent-ui";
import { StepGroup } from "@/components/ui/step-group";
import { Subagent } from "@/components/ui/subagent";

const kinds = { agent: { live: "Running", done: "Ran", one: "agent", many: "agents" } };

const agents = [
  { id: "reviewer", name: "Code reviewer", status: "complete" },
  { id: "writer", name: "Test writer", status: "running" },
  { id: "docs", name: "Docs updater", status: "pending" },
] as const;

const items: StepGroupItem[] = agents.map(({ id, status }) => ({ id, status, kind: "agent" }));

export default function StepGroupAgentsExample() {
  return (
    <StepGroup items={items} kinds={kinds}>
      {agents.map((agent) => (
        <Subagent key={agent.id} agentName={agent.name} status={agent.status} autoOpen="never" />
      ))}
    </StepGroup>
  );
}
