import type { StepStatus } from "@kind-ui/agent-ui";
import type { StepGroupOptions } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { StepList, StepListItem } from "../../../../src/react/step.js";
import { StepGroup } from "../../../../src/react/step-group.js";
import {
  SubagentContent,
  SubagentIcon,
  SubagentMeta,
  SubagentRoot,
  SubagentTitle,
  SubagentTrigger,
} from "../../../../src/react/subagent.js";
import {
  Tool,
  ToolApproval,
  ToolContent,
  ToolIcon,
  ToolInput,
  ToolTitle,
  ToolTrigger,
} from "../../../../src/react/tool.js";
import {
  type AgentRow,
  agentLabels,
  agents,
  approval,
  stepGroupHost,
  type ToolRow,
  toolLabels,
  tools,
} from "../../shared/step-group.js";

const { host, cancel, approve } = stepGroupHost();

const ToolRows = ({ rows, label }: { rows: ToolRow[]; label: string }) => (
  <StepList aria-label={label}>
    {rows.map((row) => (
      <Tool key={row.id} call={row.call} status={row.status} onApprove={approve}>
        <StepListItem value={row.id} render={<ToolTrigger />}>
          <ToolIcon />
          <ToolTitle />
        </StepListItem>
        <ToolContent>
          <ToolInput />
        </ToolContent>
        <ToolApproval />
      </Tool>
    ))}
  </StepList>
);

const AgentRows = ({ rows }: { rows: AgentRow[] }) => (
  <StepList aria-label="Agents">
    {rows.map((row) => (
      <SubagentRoot key={row.id} agentName={row.name} status={row.status} agentConfirm={false}>
        <StepListItem value={row.id} render={<SubagentTrigger />}>
          <SubagentIcon />
          <SubagentTitle />
          <SubagentMeta />
        </StepListItem>
        <SubagentContent>
          <p>{row.task}</p>
        </SubagentContent>
      </SubagentRoot>
    ))}
  </StepList>
);

function StepGroups({ motion }: { motion?: StepGroupOptions["motion"] }) {
  const [toolRows, setToolRows] = useState(tools);
  const [agentRows, setAgentRows] = useState(agents);
  useEffect(() => {
    const set =
      (status: StepStatus, id: string) =>
      <Row extends { id: string; status: StepStatus }>(rows: Row[]) =>
        rows.map((row) => (row.id === id ? { ...row, status } : row));
    Object.assign(window, {
      kindStepGroup: Object.assign(host, {
        setStatus: (id: string, status: StepStatus) => {
          setToolRows(set(status, id));
          setAgentRows(set(status, id));
        },
      }),
    });
  }, []);
  return (
    <div className="flex w-[28rem] flex-col gap-4 p-6">
      <StepGroup id="tools" items={toolRows} groupLabels={toolLabels} durationSeconds={8} motion={motion}>
        <ToolRows rows={toolRows} label="Tool calls" />
      </StepGroup>
      <StepGroup id="approval" items={[approval]} groupLabels={toolLabels} motion={motion}>
        <ToolRows rows={[approval]} label="Approval" />
      </StepGroup>
      <StepGroup id="agents" items={agentRows} groupLabels={agentLabels} onCancel={cancel} motion={motion}>
        <AgentRows rows={agentRows} />
      </StepGroup>
      <StepGroup id="plain" items={tools} label="Checked the build" />
    </div>
  );
}

export const cases = {
  all: () => <StepGroups />,
  reduced: () => <StepGroups motion="reduced" />,
};
