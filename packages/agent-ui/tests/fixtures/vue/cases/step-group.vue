<script lang="ts">
export const variants = ["all", "live", "titles"] as const;
</script>

<script setup lang="ts">
import type { StepStatus } from "@kind-ui/agent-ui";
import { onMounted, shallowRef } from "vue";
import { StepList, StepListItem } from "../../../../src/vue/step.js";
import { StepGroup } from "../../../../src/vue/step-group.js";
import {
  SubagentIcon,
  SubagentMeta,
  SubagentRoot,
  SubagentTitle,
  SubagentTrigger,
} from "../../../../src/vue/subagent.js";
import { Tool, ToolApproval, ToolIcon, ToolMeta, ToolTitle, ToolTrigger } from "../../../../src/vue/tool.js";
import { expose } from "../../shared/expose.js";
import {
  callOf,
  frames,
  kinds,
  live,
  type StepGroupHandle,
  type StepGroupRow,
  titled,
} from "../../shared/step-group.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const noop = () => {};

const itemsOf = (rows: StepGroupRow[]) =>
  rows.map(({ id, status, kind, target }) => ({ id, status, kind, target }));

const rows = shallowRef(live);
const changes: StepGroupHandle["changes"] = [];
const onOpenChange = (open: boolean, details: { reason: string }) => changes.push({ open, reason: details.reason });

const titledDone = { ...titled.running, output: { state: "available" as const, value: "ok" } };

onMounted(() => {
  if (props.variant !== "live") return;
  const handle: StepGroupHandle = {
    set: (id, status: StepStatus) => {
      rows.value = rows.value.map((row) => (row.id === id ? { ...row, status } : row));
    },
    setAll: (statuses) => {
      rows.value = rows.value.map((row) => ({ ...row, status: statuses[row.id] ?? row.status }));
    },
    changes,
  };
  expose({ kindStepGroup: handle });
});
</script>

<template>
  <div v-if="variant === 'all'" class="flex w-[36rem] max-w-full flex-col gap-6 p-6">
    <StepGroup
      v-for="frame in frames"
      :id="frame.id"
      :key="frame.id"
      :items="itemsOf(frame.rows)"
      :kinds="kinds"
      v-bind="frame.options"
    >
      <StepList :aria-label="`${frame.id} steps`">
        <template v-for="row in frame.rows" :key="row.id">
          <SubagentRoot v-if="row.kind === 'agent'" :agent-name="row.title" :status="row.status" auto-open="never">
            <StepListItem :value="row.id">
              <template #render="{ props: item, children }">
                <SubagentTrigger v-bind="item"><component :is="children" /></SubagentTrigger>
              </template>
              <SubagentIcon />
              <SubagentTitle />
              <SubagentMeta />
            </StepListItem>
          </SubagentRoot>
          <Tool
            v-else
            :call="callOf(row)"
            :status="row.status"
            :heading="row.title"
            auto-open="never"
            :on-approve="noop"
            :on-deny="noop"
          >
            <StepListItem :value="row.id">
              <template #render="{ props: item, children }">
                <ToolTrigger v-bind="item"><component :is="children" /></ToolTrigger>
              </template>
              <ToolIcon />
              <ToolTitle />
              <ToolMeta />
            </StepListItem>
            <ToolApproval />
          </Tool>
        </template>
      </StepList>
    </StepGroup>
  </div>
  <div v-else-if="variant === 'live'" class="flex w-[36rem] max-w-full flex-col gap-6 p-6">
    <StepGroup
      id="live"
      :items="itemsOf(rows)"
      :kinds="kinds"
      :duration-seconds="124"
      @open-change="onOpenChange"
    >
      <StepList aria-label="Agents">
        <SubagentRoot
          v-for="row in rows"
          :key="row.id"
          :agent-name="row.title"
          :status="row.status"
          auto-open="never"
        >
          <StepListItem :value="row.id">
            <template #render="{ props: item, children }">
              <SubagentTrigger v-bind="item"><component :is="children" /></SubagentTrigger>
            </template>
            <SubagentIcon />
            <SubagentTitle />
            <SubagentMeta />
          </StepListItem>
        </SubagentRoot>
      </StepList>
    </StepGroup>
    <button type="button">After</button>
  </div>
  <div v-else-if="variant === 'titles'" class="flex w-[36rem] max-w-full flex-col gap-2 p-6">
    <Tool id="titled" :call="titled.running" :heading="titled.heading" auto-open="never" />
    <Tool id="titled-done" :call="titledDone" :heading="titled.heading" auto-open="never" />
    <Tool id="bare" :call="titled.bare" default-open />
  </div>
  <p v-else data-no-case>No case</p>
</template>
