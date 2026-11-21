<script setup lang="ts">
import type { Approval } from "@kind-ui/agent-ui";
import type { ConfirmationDecision } from "@kind-ui/agent-ui/core";
import { ref } from "vue";
import { Confirmation } from "@/components/ui/vue/confirmation";

const approval = ref<Approval>({ approvalId: "delete", generation: 1, state: "requested" });

const record = (approved: boolean, reason?: string) => {
  approval.value = {
    ...approval.value,
    state: "responded",
    decision: { approved, ...(reason && { reason }) },
  };
};
const onApprove = () => record(true);
const onDeny = ({ reason }: ConfirmationDecision) => record(false, reason);
</script>

<template>
  <Confirmation label="Delete notes.md?" :approval="approval" reason :on-approve="onApprove" :on-deny="onDeny" />
</template>
