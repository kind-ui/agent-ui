<script setup lang="ts">
import type { ApprovalModeOption } from "@kind-ui/agent-ui";
import { ref } from "vue";
import { ApprovalMode } from "@/components/ui/vue/approval-mode";

const modes: ApprovalModeOption[] = [
  { value: "ask", label: "Ask every time", description: "Approve each tool call" },
  { value: "edits", label: "Allow edits", description: "Edit files without asking" },
  { value: "full", label: "Full access", description: "Run anything without asking", danger: true },
];

const value = ref("ask");
</script>

<template>
  <ApprovalMode :modes="modes" v-model:value="value" learn-more-href="#agent" />
</template>
