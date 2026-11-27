<script setup lang="ts">
import type { Approval } from "@kind-ui/agent-ui";
import { computed, ref, watchEffect } from "vue";
import { Terminal } from "@/components/ui/vue/terminal";

const lines = ["> app@1.0.0 test\n", "✓ sign-in.test.ts (12 tests)\n", "✓ session.test.ts (9 tests)"];

const approval = ref<Approval>({ approvalId: "test", generation: 1, state: "requested" });
const shown = ref(0);
const record = (decision: Approval["decision"]) => {
  approval.value = { ...approval.value, state: "responded", decision };
};
const onDeny = () => record({ approved: false });
const onAlwaysAllow = () => record({ approved: true, always: true });
const onApprove = () => record({ approved: true });

// Stands in for the command running once it's approved.
watchEffect((onCleanup) => {
  if (approval.value.decision?.approved !== true || shown.value >= lines.length) return;
  const timer = setTimeout(() => shown.value++, 600);
  onCleanup(() => clearTimeout(timer));
});

const done = computed(() => shown.value === lines.length);
</script>

<template>
  <Terminal
    command="npm test"
    :approval="approval"
    :output="lines.slice(0, shown).join('')"
    :exit-code="done ? 0 : undefined"
    :duration-seconds="done ? 2 : undefined"
    always-target="npm test"
    always-scope="in this project"
    always-detail="Covers commands starting with `npm test`, in this project."
    :on-deny="onDeny"
    :on-always-allow="onAlwaysAllow"
    :on-approve="onApprove"
  />
</template>
