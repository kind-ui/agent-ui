import type { StepStatus } from "@kind-ui/agent-ui";
import { createSignal, For } from "solid-js";
import { StepGroup } from "@/components/ui/solid/step-group";
import { Subagent } from "@/components/ui/solid/subagent";

const agents: { id: string; name: string; status: StepStatus }[] = [
  { id: "reviewer", name: "Code reviewer", status: "running" },
  { id: "writer", name: "Docs writer", status: "running" },
  { id: "tester", name: "Test runner", status: "complete" },
];

export default function StepGroupAgentsExample() {
  const [rows, setRows] = createSignal(agents);
  return (
    <StepGroup
      items={rows().map(({ id, status }) => ({ id, status, group: "agent" }))}
      groupLabels={{ agent: (count) => `${count} agents` }}
      onCancel={() =>
        setRows((all) => all.map((row) => (row.status === "running" ? { ...row, status: "cancelled" } : row)))
      }
    >
      <For each={rows()} keyed={(row) => row.id}>
        {(row) => <Subagent agentName={row().name} status={row().status} agentConfirm={false} />}
      </For>
    </StepGroup>
  );
}
