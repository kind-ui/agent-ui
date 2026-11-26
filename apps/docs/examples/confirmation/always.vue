<script setup lang="ts">
import type { Approval } from "@kind-ui/agent-ui";
import type { ConfirmationDecision } from "@kind-ui/agent-ui/core";
import { ref } from "vue";
import { Confirmation } from "@/components/ui/vue/confirmation";

const approval = ref<Approval>({ approvalId: "search", generation: 1, state: "requested" });

const record = (decision: Approval["decision"]) => {
  approval.value = { ...approval.value, state: "responded", decision };
};
const onDeny = () => record({ approved: false });
const onAlwaysAllow = ({ scope }: ConfirmationDecision) =>
  record({ approved: true, always: true, ...(scope && { scope }) });
const onApprove = () => record({ approved: true });
</script>

<template>
  <Confirmation
    label="Allow `search_docs`?"
    :approval="approval"
    always-target="search_docs"
    always-scope="in this project"
    always-detail="Covers `search_docs` in this project. You can change it in Settings."
    :on-deny="onDeny"
    :on-always-allow="onAlwaysAllow"
    :on-approve="onApprove"
  />
</template>
