<script setup lang="ts">
import type { Approval } from "@kind-ui/agent-ui";
import type { ConfirmationDecision } from "@kind-ui/agent-ui/core";
import { ref } from "vue";
import { Terminal } from "@/components/ui/vue/terminal";

const approval = ref<Approval>({ approvalId: "test", generation: 1, state: "requested" });
const output = ref("");

const record = (approved: boolean, reason?: string) => {
  approval.value = {
    ...approval.value,
    state: "responded",
    decision: { approved, ...(reason && { reason }) },
  };
  if (approved) output.value = "\x1b[32m✓\x1b[0m 22 tests passed";
};
const onApprove = () => record(true);
const onDeny = ({ reason }: ConfirmationDecision) => record(false, reason);
</script>

<template>
  <Terminal
    command="npm test"
    :approval="approval"
    :output="output"
    :exit-code="output ? 0 : undefined"
    approval-reason
    :on-approve="onApprove"
    :on-always-allow="onApprove"
    :on-deny="onDeny"
    class="w-full max-w-xl"
  />
</template>
