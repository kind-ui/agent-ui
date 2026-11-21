<script lang="ts">
export const variants = ["all", "reduced"] as const;
</script>

<script setup lang="ts">
import type { StepStatus, ToolCall } from "@kind-ui/agent-ui";
import { onMounted, shallowRef } from "vue";
import { StepList, StepListItem } from "../../../../src/vue/step.js";
import { Subagent } from "../../../../src/vue/subagent.js";
import { Tool, ToolContent, ToolIcon, ToolInput, ToolTitle, ToolTrigger } from "../../../../src/vue/tool.js";
import { expose } from "../../shared/expose.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const call = (name: string): ToolCall => ({
  toolCallId: name,
  name,
  dynamic: false,
  input: { state: "ready", value: { path: "src/index.ts" } },
  output: { state: "available", value: "ok" },
});

const AVATAR = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#7c6cf0"/></svg>')}`;

const RESULT = "Found **2** issues: an unused import and a missing `await`.";

const motion = props.variant === "reduced" ? "reduced" : undefined;
const status = shallowRef<StepStatus>("running");
const calls = shallowRef([call("read_file"), call("grep")]);
const cancels: { resolve(): void; reject(): void }[] = [];

const cancel = () => new Promise<void>((resolve, reject) => cancels.push({ resolve, reject }));
const cancelQuick = () => {};

onMounted(() =>
  expose({
    kindCancels: cancels,
    kindSubagent: {
      setStatus: (next: StepStatus) => {
        status.value = next;
      },
      append: (name: string) => {
        calls.value = [...calls.value, call(name)];
      },
    },
  }),
);
</script>

<template>
  <div class="flex w-[28rem] flex-col gap-4 p-6">
    <Subagent
      id="subagent"
      agent-name="Code reviewer"
      :status="status"
      :duration-seconds="status === 'complete' ? 12 : undefined"
      :result="RESULT"
      :motion="motion"
      :on-cancel="cancel"
    >
      <StepList aria-label="Code reviewer steps">
        <Tool v-for="c in calls" :key="c.toolCallId" :call="c">
          <StepListItem :value="c.toolCallId">
            <template #render="{ props: item, children }">
              <ToolTrigger v-bind="item"><component :is="children" /></ToolTrigger>
            </template>
            <ToolIcon />
            <ToolTitle />
          </StepListItem>
          <ToolContent>
            <ToolInput />
          </ToolContent>
        </Tool>
      </StepList>
    </Subagent>
    <Subagent
      id="quick"
      agent-name="Docs writer"
      :avatar-src="AVATAR"
      status="running"
      :agent-confirm="false"
      :on-cancel="cancelQuick"
    />
    <Subagent id="readonly" agent-name="Test runner" status="running" />
    <Subagent id="done" agent-name="Release notes bot" status="complete" :duration-seconds="4" :result="RESULT" />
    <Subagent id="empty" agent-name="Linter" status="complete" />
  </div>
</template>
