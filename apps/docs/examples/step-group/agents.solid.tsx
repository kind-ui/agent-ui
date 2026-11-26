import type { StepGroupItem } from "@kind-ui/agent-ui";
import { For } from "solid-js";
import { StepGroup } from "@/components/ui/solid/step-group";
import { Subagent } from "@/components/ui/solid/subagent";

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
      <For each={agents}>
        {(agent) => <Subagent agentName={agent.name} status={agent.status} autoOpen="never" />}
      </For>
    </StepGroup>
  );
}
