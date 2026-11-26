<script lang="ts">
export const variants = ["all", "reduced"] as const;
</script>

<script setup lang="ts">
import type { StepStatus } from "@kind-ui/agent-ui";
import { computed, onMounted, shallowRef } from "vue";
import { StepList, StepListItem } from "../../../../src/vue/step.js";
import { StepGroup } from "../../../../src/vue/step-group.js";
import {
  SubagentContent,
  SubagentIcon,
  SubagentMeta,
  SubagentRoot,
  SubagentTitle,
  SubagentTrigger,
} from "../../../../src/vue/subagent.js";
import {
  Tool,
  ToolApproval,
  ToolContent,
  ToolIcon,
  ToolInput,
  ToolTitle,
  ToolTrigger,
} from "../../../../src/vue/tool.js";
import { expose } from "../../shared/expose.js";
import { agentLabels, agents, approval, stepGroupHost, toolLabels, tools } from "../../shared/step-group.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const motion = props.variant === "reduced" ? "reduced" : undefined;
const { host, cancel, approve } = stepGroupHost();
const toolRows = shallowRef(tools);
const agentRows = shallowRef(agents);
const approvals = [approval];
const toolLists = computed(() => [
  { id: "tools", rows: toolRows.value, label: "Tool calls", durationSeconds: 8 },
  { id: "approval", rows: approvals, label: "Approval", durationSeconds: undefined },
]);

const set = <Row extends { id: string; status: StepStatus }>(rows: Row[], id: string, status: StepStatus) =>
  rows.map((row) => (row.id === id ? { ...row, status } : row));

onMounted(() =>
  expose({
    kindStepGroup: Object.assign(host, {
      setStatus: (id: string, status: StepStatus) => {
        toolRows.value = set(toolRows.value, id, status);
        agentRows.value = set(agentRows.value, id, status);
      },
    }),
  }),
);
</script>

<template>
  <div class="flex w-[28rem] flex-col gap-4 p-6">
    <StepGroup
      v-for="list in toolLists"
      :id="list.id"
      :key="list.id"
      :items="list.rows"
      :group-labels="toolLabels"
      :duration-seconds="list.durationSeconds"
      :motion="motion"
    >
      <StepList :aria-label="list.label">
        <Tool v-for="row in list.rows" :key="row.id" :call="row.call" :status="row.status" @approve="approve">
          <StepListItem :value="row.id">
            <template #render="{ props: item, children }">
              <ToolTrigger v-bind="item"><component :is="children" /></ToolTrigger>
            </template>
            <ToolIcon />
            <ToolTitle />
          </StepListItem>
          <ToolContent>
            <ToolInput />
          </ToolContent>
          <ToolApproval />
        </Tool>
      </StepList>
    </StepGroup>
    <StepGroup id="agents" :items="agentRows" :group-labels="agentLabels" :motion="motion" @cancel="cancel">
      <StepList aria-label="Agents">
        <SubagentRoot
          v-for="row in agentRows"
          :key="row.id"
          :agent-name="row.name"
          :status="row.status"
          :agent-confirm="false"
        >
          <StepListItem :value="row.id">
            <template #render="{ props: item, children }">
              <SubagentTrigger v-bind="item"><component :is="children" /></SubagentTrigger>
            </template>
            <SubagentIcon />
            <SubagentTitle />
            <SubagentMeta />
          </StepListItem>
          <SubagentContent>
            <p>{{ row.task }}</p>
          </SubagentContent>
        </SubagentRoot>
      </StepList>
    </StepGroup>
    <StepGroup id="plain" :items="tools" label="Checked the build" />
  </div>
</template>
