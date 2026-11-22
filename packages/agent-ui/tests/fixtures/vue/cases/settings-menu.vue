<script lang="ts">
export const variants = ["all", "reduced", "refusing"] as const;
</script>

<script setup lang="ts">
import type { SettingsValues } from "@kind-ui/agent-ui";
import type { SettingsMenuChangeDetails } from "@kind-ui/agent-ui/core";
import { onMounted, shallowRef } from "vue";
import { SettingsMenu } from "../../../../src/vue/settings-menu.js";
import { expose } from "../../shared/expose.js";
import { initialValues, settings, settingsMenuHost } from "../../shared/settings-menu.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const { host, change } = settingsMenuHost();
const values = shallowRef<SettingsValues>(initialValues);

function onValues(next: SettingsValues, details: SettingsMenuChangeDetails) {
  change(next, details);
  if (props.variant === "refusing") details.cancel();
  else values.value = next;
}

onMounted(() => expose({ kindHost: host }));
</script>

<template>
  <div class="p-6">
    <SettingsMenu
      id="settings"
      :settings="settings"
      :values="values"
      :motion="variant === 'reduced' ? 'reduced' : undefined"
      @values-change="onValues"
    />
  </div>
</template>
