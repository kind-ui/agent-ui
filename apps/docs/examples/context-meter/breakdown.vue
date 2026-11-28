<script setup lang="ts">
import type { UsageSlice } from "@kind-ui/agent-ui";
import { computed, ref } from "vue";
import { ContextMeter } from "@/components/ui/vue/context-meter";

const full: UsageSlice[] = [
  { id: "messages", label: "Messages", value: 41_200 },
  { id: "files", label: "Files", value: 18_100 },
  { id: "tools", label: "Tools", value: 9_800 },
  { id: "system", label: "System", value: 3_800 },
];

const compacted: UsageSlice[] = [
  { id: "messages", label: "Messages", value: 4_600 },
  { id: "files", label: "Files", value: 3_600 },
  { id: "tools", label: "Tools", value: 0 },
  { id: "system", label: "System", value: 3_800 },
];

const breakdown = ref(full);
const used = computed(() => breakdown.value.reduce((total, slice) => total + slice.value, 0));

const compact = () =>
  new Promise<void>((resolve) => {
    setTimeout(() => {
      breakdown.value = compacted;
      resolve();
    }, 1500);
  });
</script>

<template>
  <ContextMeter
    :used="used"
    :total="128_000"
    :breakdown="breakdown"
    :compact-at="0.8"
    :on-compact="compact"
  />
</template>
