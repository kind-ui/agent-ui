<script setup lang="ts">
import type { SettingsValues } from "@kind-ui/agent-ui";
import { shallowRef } from "vue";
import { Composer, ComposerInput, ComposerSubmit } from "@/components/ui/vue/composer";
import { SettingsMenu, type SettingsMenuSetting } from "@/components/ui/vue/settings-menu";

const settings: SettingsMenuSetting[] = [
  {
    type: "toggle",
    id: "search",
    label: "Web search",
    description: "Look things up before answering",
  },
  { type: "toggle", id: "memory", label: "Memory" },
  {
    type: "choice",
    id: "style",
    label: "Response style",
    options: [
      { value: "concise", label: "Concise" },
      { value: "balanced", label: "Balanced" },
      { value: "detailed", label: "Detailed" },
    ],
  },
];

const values = shallowRef<SettingsValues>({ search: true, memory: false, style: "balanced" });
const send = () => new Promise<void>((resolve) => setTimeout(resolve, 1000));
</script>

<template>
  <Composer aria-label="Message" :on-submit="send">
    <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
    <SettingsMenu v-model:values="values" style="grid-area: attach" :settings="settings" />
    <ComposerSubmit />
  </Composer>
</template>
