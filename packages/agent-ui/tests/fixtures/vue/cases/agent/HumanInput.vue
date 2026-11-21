<script setup lang="ts">
import type { Answers } from "@kind-ui/agent-ui";
import { computed, ref, shallowRef } from "vue";
import { Checkpoint } from "../../../../../src/vue/checkpoint.js";
import { Confirmation } from "../../../../../src/vue/confirmation.js";
import { ContextMeter } from "../../../../../src/vue/context-meter.js";
import { Feedback } from "../../../../../src/vue/feedback.js";
import { GuardrailNotice } from "../../../../../src/vue/guardrail-notice.js";
import { ModelSelector } from "../../../../../src/vue/model-selector.js";
import { Notice } from "../../../../../src/vue/notice.js";
import { Question } from "../../../../../src/vue/question.js";
import { ReasoningEffort } from "../../../../../src/vue/reasoning-effort.js";
import { Suggestion } from "../../../../../src/vue/suggestion.js";
import { Tool } from "../../../../../src/vue/tool.js";
import { approvalCall } from "../../../shared/agent.js";
import { context } from "../../../shared/context-meter.js";
import { levels, modelActions, models } from "../../../shared/model-selector.js";
import { guardrails, type NoticeData, notices } from "../../../shared/notice.js";
import { deployQuestions } from "../../../shared/question.js";
import { suggestions } from "../../../shared/suggestion.js";
import { type Details, host } from "./host.js";

const props = defineProps<{ confirm: boolean; wave: 3 | 5 }>();

const rateLimited = notices.find((notice) => notice.id === "warning") as NoticeData;
const approval = { approvalId: "migrate", generation: 1, state: "requested" } as const;

const submitted = shallowRef<Answers>();
const shown = ref({ notice: true, guardrail: true });
const remove = (part: "notice" | "guardrail") => () => {
  host.calls.push("dismiss");
  shown.value = { ...shown.value, [part]: false };
};
const submit = (answers: Answers, details: unknown) =>
  host
    .decide("submit")(answers, details)
    .then(() => {
      submitted.value = answers;
    });
const skip = (answers: Answers, details: unknown) =>
  host
    .decide("skip")(answers, details)
    .then(() => {
      submitted.value = {};
    });
const modelExtras = computed(() =>
  props.wave === 5 ? { actions: modelActions, onAction: host.decide("model-action") } : {},
);
</script>

<template>
  <div class="flex w-[40rem] flex-col gap-8 p-6">
    <section data-case="tool-approval">
      <Tool
        id="delete_file"
        :call="approvalCall"
        :onApprove="host.decide('approve')"
        :onDeny="host.decide('deny')"
      />
    </section>
    <section data-case="confirmation">
      <Confirmation
        id="confirmation"
        label="Run the migration?"
        :approval="approval"
        :onApprove="host.decide('approve')"
        :onDeny="host.decide('deny')"
      />
    </section>
    <section data-case="question">
      <Question
        id="question"
        label="Deploy questions"
        :questions="deployQuestions"
        :agent-confirm="confirm"
        :submitted="submitted"
        :onValueChange="(_value: unknown, details: Details) => host.change('question', details)"
        :onSubmit="submit"
        :onSkip="skip"
      />
    </section>
    <section data-case="checkpoint">
      <Checkpoint
        id="checkpoint"
        description="Before editing auth.ts"
        :agent-confirm="confirm"
        :onOpenChange="(_open: boolean, details: Details) => host.change('checkpoint', details)"
        :onRestore="host.decide('restore')"
      />
    </section>
    <section data-case="model-selector" class="flex items-center gap-2">
      <ModelSelector
        id="model"
        :models="models"
        default-value="gpt-5"
        :onValueChange="(_value: unknown, details: Details) => host.change('model', details)"
        v-bind="modelExtras"
      />
      <ReasoningEffort
        id="effort"
        :levels="levels"
        default-value="medium"
        :onValueChange="(_value: unknown, details: Details) => host.change('effort', details)"
      />
      <ContextMeter
        id="context"
        v-bind="context"
        :onOpenChange="(_open: boolean, details: Details) => host.change('context', details)"
      />
    </section>
    <section data-case="suggestion">
      <Suggestion id="suggestion" :suggestions="suggestions" :onPick="host.decide('pick')" />
    </section>
    <section data-case="feedback">
      <Feedback
        id="feedback"
        :onRatingChange="(_rating: unknown, details: Details) => host.change('feedback', details)"
        :onComment="host.decide('comment')"
      />
    </section>
    <section id="notice" data-case="notice">
      <Notice
        v-if="shown.notice"
        :variant="rateLimited.variant"
        :label="rateLimited.label"
        :onDismiss="remove('notice')"
      >
        {{ rateLimited.text }}
      </Notice>
    </section>
    <section id="guardrail" data-case="guardrail-notice">
      <GuardrailNotice
        v-if="shown.guardrail"
        v-bind="guardrails.blocking"
        blocking
        :onOpenChange="(_open: boolean, details: Details) => host.change('guardrail', details)"
        :onDismiss="remove('guardrail')"
      />
    </section>
  </div>
</template>
