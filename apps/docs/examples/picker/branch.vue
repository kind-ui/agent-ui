<script setup lang="ts">
import { h, ref, shallowRef } from "vue";
import { Picker } from "@/components/ui/vue/picker";

const gitBranchIcon = () =>
  h(
    "svg",
    {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
    },
    [
      h("line", { x1: "6", x2: "6", y1: "3", y2: "15" }),
      h("circle", { cx: "18", cy: "6", r: "3" }),
      h("circle", { cx: "6", cy: "18", r: "3" }),
      h("path", { d: "M18 9a9 9 0 0 1-9 9" }),
    ],
  );

const initialBranches = [
  { value: "main", label: "main", icon: gitBranchIcon() },
  {
    value: "picker",
    label: "picker",
    description: "Add the Picker component",
    meta: "↑3 ↓1",
    icon: gitBranchIcon(),
  },
  { value: "menus", label: "menus", meta: "↑1 ↓4", icon: gitBranchIcon() },
];

const branches = shallowRef(initialBranches);
const branch = ref<string | null>("picker");

function addBranch() {
  const value = `branch-${branches.value.length - initialBranches.length + 1}`;
  branches.value = [...branches.value, { value, label: value, icon: gitBranchIcon() }];
  branch.value = value;
}
</script>

<template>
  <Picker
    v-model:value="branch"
    label="Branch"
    placeholder="Search branches…"
    :items="branches"
    :actions="[{ id: 'new-branch', label: 'New branch' }]"
    @action="addBranch"
  />
</template>
