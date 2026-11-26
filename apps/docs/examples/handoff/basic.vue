<script setup lang="ts">
import type { Approval } from "@kind-ui/agent-ui";
import type { HandoffStatus } from "@kind-ui/agent-ui/core";
import { ref } from "vue";
import { Handoff } from "@/components/ui/vue/handoff";

const approval = ref<Approval>({ approvalId: "billing", generation: 1, state: "requested" });
const status = ref<HandoffStatus>("pending");

const record = (approved: boolean) => {
  approval.value = { ...approval.value, state: "responded", decision: { approved } };
  status.value = approved ? "accepted" : "declined";
};
</script>

<template>
  <Handoff
    :from="{ id: 'support', name: 'Support' }"
    :to="{ id: 'billing', name: 'Billing' }"
    reason="The customer asked for a refund on their last invoice"
    :status="status"
    :approval="approval"
    :on-approve="() => record(true)"
    :on-deny="() => record(false)"
    class="w-full max-w-xl"
  />
</template>
