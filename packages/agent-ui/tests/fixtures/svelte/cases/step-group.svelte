<script module lang="ts">
  export const variants = ["all", "reduced"];
</script>

<script lang="ts">
  import type { StepStatus } from "@kind-ui/agent-ui";
  import { StepList, StepListItem } from "../../../../src/svelte/step/index.js";
  import { StepGroup } from "../../../../src/svelte/step-group/index.js";
  import {
    SubagentContent,
    SubagentIcon,
    SubagentMeta,
    SubagentRoot,
    SubagentTitle,
    SubagentTrigger,
  } from "../../../../src/svelte/subagent/index.js";
  import {
    Tool,
    ToolApproval,
    ToolContent,
    ToolIcon,
    ToolInput,
    ToolTitle,
    ToolTrigger,
  } from "../../../../src/svelte/tool/index.js";
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

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const motion = $derived(variant === "reduced" ? "reduced" : undefined);
  const { host, cancel, approve } = stepGroupHost();

  let toolRows: ToolRow[] = $state.raw(tools);
  let agentRows: AgentRow[] = $state.raw(agents);

  const set = <Row extends { id: string; status: StepStatus }>(rows: Row[], id: string, status: StepStatus) =>
    rows.map((row) => (row.id === id ? { ...row, status } : row));

  expose({
    kindStepGroup: Object.assign(host, {
      setStatus: (id: string, status: StepStatus) => {
        toolRows = set(toolRows, id, status);
        agentRows = set(agentRows, id, status);
      },
    }),
  });
</script>

{#snippet toolList(rows: ToolRow[], label: string)}<StepList aria-label={label}
    >{#each rows as row (row.id)}<Tool call={row.call} status={row.status} onApprove={approve}
        ><StepListItem value={row.id}
          >{#snippet render({ props }: { props: Record<string, unknown> })}<ToolTrigger {...props}
              ><ToolIcon
              /><ToolTitle
            /></ToolTrigger
          >{/snippet}</StepListItem
        ><ToolContent
          ><ToolInput
        /></ToolContent
        ><ToolApproval
      /></Tool
    >{/each}</StepList
  >{/snippet}

<div class="flex w-[28rem] flex-col gap-4 p-6"
  ><StepGroup id="tools" items={toolRows} groupLabels={toolLabels} durationSeconds={8} {motion}
    >{@render toolList(toolRows, "Tool calls")}</StepGroup
  ><StepGroup id="approval" items={[approval]} groupLabels={toolLabels} {motion}
    >{@render toolList([approval], "Approval")}</StepGroup
  ><StepGroup id="agents" items={agentRows} groupLabels={agentLabels} onCancel={cancel} {motion}
    ><StepList aria-label="Agents"
      >{#each agentRows as row (row.id)}<SubagentRoot agentName={row.name} status={row.status} agentConfirm={false}
          ><StepListItem value={row.id}
            >{#snippet render({ props }: { props: Record<string, unknown> })}<SubagentTrigger {...props}
                ><SubagentIcon
                /><SubagentTitle
                /><SubagentMeta
              /></SubagentTrigger
            >{/snippet}</StepListItem
          ><SubagentContent
            ><p>{row.task}</p></SubagentContent
          ></SubagentRoot
        >{/each}</StepList
    ></StepGroup
  ><StepGroup id="plain" items={tools} label="Checked the build"
/></div>
