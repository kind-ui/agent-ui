"use client";

import type { StepStatus } from "@kind-ui/agent-ui";
import { useState } from "react";
import { StepGroup } from "@/components/ui/step-group";
import { Subagent } from "@/components/ui/subagent";

const agents: { id: string; name: string; status: StepStatus }[] = [
  { id: "reviewer", name: "Code reviewer", status: "running" },
  { id: "writer", name: "Docs writer", status: "running" },
  { id: "tester", name: "Test runner", status: "complete" },
];

export default function StepGroupAgentsExample() {
  const [rows, setRows] = useState(agents);
  return (
    <StepGroup
      items={rows.map(({ id, status }) => ({ id, status, group: "agent" }))}
      groupLabels={{ agent: (count) => `${count} agents` }}
      onCancel={() =>
        setRows((all) => all.map((row) => (row.status === "running" ? { ...row, status: "cancelled" } : row)))
      }
    >
      {rows.map((row) => (
        <Subagent key={row.id} agentName={row.name} status={row.status} agentConfirm={false} />
      ))}
    </StepGroup>
  );
}
