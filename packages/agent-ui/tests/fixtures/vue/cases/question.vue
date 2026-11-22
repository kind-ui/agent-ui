<script lang="ts">
import type { AgentAction } from "@ui-sdk/vue/agent";
import { questionHost } from "../../shared/question.js";

export const variants = ["all", "reduced", "refused"] as const;

const { host, submit, skip } = questionHost();

export const allow = (step: AgentAction) => !step.confirm || host.permit;
</script>

<script setup lang="ts">
import type { Answers } from "@kind-ui/agent-ui";
import { onMounted, shallowRef } from "vue";
import { Question } from "../../../../src/vue/question.js";
import { expose } from "../../shared/expose.js";
import { deployQuestions } from "../../shared/question.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const submitted = shallowRef<Answers>();
const motion = props.variant === "reduced" ? "reduced" : undefined;
const value = shallowRef<Answers>({ env: "staging" });
const refusing = shallowRef(true);

const onValueChange = (next: Answers) => {
  if (!refusing.value) value.value = next;
};

onMounted(() =>
  expose(
    props.variant === "refused"
      ? {
          kindHost: host,
          kindRefuse: (next: boolean) => {
            refusing.value = next;
          },
        }
      : {
          kindHost: host,
          kindQuestion: {
            record: (next: Answers | undefined) => {
              submitted.value = next;
            },
          },
        },
  ),
);
</script>

<template>
  <div v-if="variant === 'refused'" class="flex w-[28rem] flex-col gap-4 p-6">
    <Question
      id="deploy"
      label="Deploy questions"
      :questions="deployQuestions"
      :value="value"
      :on-submit="submit"
      @value-change="onValueChange"
    />
  </div>
  <div v-else class="flex w-[28rem] flex-col gap-4 p-6">
    <p id="above">Above</p>
    <Question
      id="deploy"
      label="Deploy questions"
      :questions="deployQuestions"
      :submitted="submitted"
      :on-submit="submit"
      :on-skip="skip"
      :motion="motion"
    />
    <p id="below">Below</p>
  </div>
</template>
