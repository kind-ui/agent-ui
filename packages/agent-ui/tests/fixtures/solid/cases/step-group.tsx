import type { StepStatus } from "@kind-ui/agent-ui";
import type { StepGroupOptions } from "@kind-ui/agent-ui/core";
import { createSignal, For, onSettled } from "solid-js";
import { StepList, StepListItem } from "../../../../src/solid/step.js";
import { StepGroup } from "../../../../src/solid/step-group.js";
import {
  SubagentContent,
  SubagentIcon,
  SubagentMeta,
  SubagentRoot,
  SubagentTitle,
  SubagentTrigger,
} from "../../../../src/solid/subagent.js";
import {
  Tool,
  ToolApproval,
  ToolContent,
  ToolIcon,
  ToolInput,
  ToolTitle,
  ToolTrigger,
} from "../../../../src/solid/tool.js";
import { expose } from "../../shared/expose.js";
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

function ToolRows(props: { rows: ToolRow[]; label: string }) {
  return (
    <StepList aria-label={props.label}>
      <For each={props.rows} keyed={(row) => row.id}>
        {(row) => (
          <Tool call={row().call} status={row().status} onApprove={approve}>
            <StepListItem value={row().id} render={ToolTrigger}>
              <ToolIcon />
              <ToolTitle />
            </StepListItem>
            <ToolContent>
              <ToolInput />
            </ToolContent>
            <ToolApproval />
          </Tool>
        )}
      </For>
    </StepList>
  );
}

function AgentRows(props: { rows: AgentRow[] }) {
  return (
    <StepList aria-label="Agents">
      <For each={props.rows} keyed={(row) => row.id}>
        {(row) => (
          <SubagentRoot agentName={row().name} status={row().status} agentConfirm={false}>
            <StepListItem value={row().id} render={SubagentTrigger}>
              <SubagentIcon />
              <SubagentTitle />
              <SubagentMeta />
            </StepListItem>
            <SubagentContent>
              <p>{row().task}</p>
            </SubagentContent>
          </SubagentRoot>
        )}
      </For>
    </StepList>
  );
}

function StepGroups(props: { motion?: StepGroupOptions["motion"] }) {
  const [toolRows, setToolRows] = createSignal(tools);
  const [agentRows, setAgentRows] = createSignal(agents);
  onSettled(() => {
    const set =
      (status: StepStatus, id: string) =>
      <Row extends { id: string; status: StepStatus }>(rows: Row[]) =>
        rows.map((row) => (row.id === id ? { ...row, status } : row));
    expose({
      kindStepGroup: Object.assign(host, {
        setStatus: (id: string, status: StepStatus) => {
          setToolRows(set(status, id));
          setAgentRows(set(status, id));
        },
      }),
    });
  });
  return (
    <div class="flex w-[28rem] flex-col gap-4 p-6">
      <StepGroup
        id="tools"
        items={toolRows()}
        groupLabels={toolLabels}
        durationSeconds={8}
        motion={props.motion}
      >
        <ToolRows rows={toolRows()} label="Tool calls" />
      </StepGroup>
      <StepGroup id="approval" items={[approval]} groupLabels={toolLabels} motion={props.motion}>
        <ToolRows rows={[approval]} label="Approval" />
      </StepGroup>
      <StepGroup
        id="agents"
        items={agentRows()}
        groupLabels={agentLabels}
        onCancel={cancel}
        motion={props.motion}
      >
        <AgentRows rows={agentRows()} />
      </StepGroup>
      <StepGroup id="plain" items={tools} label="Checked the build" />
    </div>
  );
}

export const cases = {
  all: () => <StepGroups />,
  reduced: () => <StepGroups motion="reduced" />,
};
