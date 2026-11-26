<script setup lang="ts">
import type { QueueItem } from "@kind-ui/agent-ui";
import { shallowRef } from "vue";
import {
  Composer,
  ComposerAttach,
  ComposerInput,
  ComposerSteerMenu,
  ComposerStop,
  ComposerSubmit,
} from "../../../../../src/vue/composer.js";
import { Diff } from "../../../../../src/vue/diff.js";
import { Handoff } from "../../../../../src/vue/handoff.js";
import {
  Message,
  MessageContent,
  MessageDelivery,
  MessageHeader,
  MessageOutcome,
  MessageRetrying,
} from "../../../../../src/vue/message.js";
import { Queue } from "../../../../../src/vue/queue.js";
import { StepList, StepListItem } from "../../../../../src/vue/step.js";
import { StepGroup } from "../../../../../src/vue/step-group.js";
import {
  SubagentContent,
  SubagentIcon,
  SubagentMeta,
  SubagentRoot,
  SubagentTitle,
  SubagentTrigger,
} from "../../../../../src/vue/subagent.js";
import { Terminal } from "../../../../../src/vue/terminal.js";
import { Tool } from "../../../../../src/vue/tool.js";
import { steerQueue } from "../../../shared/composer-steer.js";
import { after, before } from "../../../shared/diff.js";
import { handoffs } from "../../../shared/handoff.js";
import { delivered, retrying } from "../../../shared/message.js";
import { agentLabels, agents } from "../../../shared/step-group.js";
import { retryRows } from "../../../shared/tool-retry.js";
import { host } from "./host.js";

defineProps<{ confirm: boolean }>();

const billing = handoffs.billing as (typeof handoffs)[string];
const requested = (approvalId: string) => ({ approvalId, generation: 1, state: "requested" as const });

const queue = shallowRef<readonly QueueItem[]>(steerQueue);
const onSend = (id: string, details: { source: string }) =>
  host
    .decide("queue-send")(details)
    .then(() => {
      queue.value = queue.value.filter((item) => item.id !== id);
    });
</script>

<template>
  <div class="flex w-[40rem] flex-col gap-8 p-6">
    <section id="steer" data-case="composer-steer">
      <Composer
        aria-label="Steer"
        running
        :onSubmit="host.submit"
        :onStop="host.stop"
        :onSteer="host.decide('composer-steer')"
      >
        <ComposerInput aria-label="Steer prompt" />
        <ComposerAttach />
        <ComposerSubmit />
        <ComposerSteerMenu />
        <ComposerStop />
      </Composer>
    </section>
    <section id="next" data-case="queue">
      <Queue label="Next up" :items="queue" :onSend="onSend" />
    </section>
    <section id="queued" data-case="message">
      <Message
        aria-label="Queued message"
        message-role="user"
        :text="delivered.queued"
        delivery="queued"
        :onWithdraw="host.decide('message-withdraw')"
      >
        <MessageHeader>
          <MessageDelivery />
        </MessageHeader>
        <MessageContent>{{ delivered.queued }}</MessageContent>
      </Message>
    </section>
    <section id="retrying" data-case="message">
      <Message aria-label="Retrying answer" status="streaming" :text="delivered.answer" :retry="retrying">
        <MessageContent>{{ delivered.answer }}</MessageContent>
        <MessageRetrying />
        <MessageOutcome />
      </Message>
    </section>
    <section id="run" data-case="terminal">
      <Terminal
        command="npm test"
        output=""
        :approval="requested('run')"
        approval-reason
        :onApprove="host.decide('terminal-approve')"
        :onDeny="host.decide('terminal-deny')"
        :onAlwaysAllow="host.decide('terminal-always')"
      />
    </section>
    <section id="tool-retry" data-case="tool">
      <Tool v-bind="retryRows.failed" :onRetry="host.decide('tool-retry')" />
    </section>
    <section id="diff" data-case="diff">
      <Diff
        :file="{ path: 'src/values.ts', language: 'ts' }"
        :before="before"
        :after="after"
        :agent-confirm="confirm"
        :onAccept="host.decide('diff-accept')"
        :onRevert="host.decide('diff-revert')"
      />
    </section>
    <section id="group" data-case="step-group">
      <StepGroup :items="agents" :group-labels="agentLabels" :onCancel="host.decide('group-cancel')">
        <StepList aria-label="Agents">
          <SubagentRoot
            v-for="row in agents"
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
    </section>
    <section id="handoff" data-case="handoff">
      <Handoff
        :from="billing.from"
        :to="billing.to"
        :reason="billing.reason"
        status="pending"
        :approval="requested('billing')"
        :onApprove="host.decide('handoff-approve')"
        :onDeny="host.decide('handoff-deny')"
        :onAlwaysAllow="host.decide('handoff-always')"
      />
    </section>
  </div>
</template>
