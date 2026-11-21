<script lang="ts">
export const variants = ["plain", "all", "reduced", "refusing", "sheet"] as const;
</script>

<script setup lang="ts">
import type { ChangeDetails } from "@ui-sdk/core";
import { onMounted } from "vue";
import { Picker } from "../../../../src/vue/picker.js";
import { expose } from "../../shared/expose.js";
import { pickerHost, placeActions, places } from "../../shared/picker.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const { host, record } = pickerHost();
const refusing = props.variant === "refusing";
const motion = props.variant === "reduced" ? "reduced" : undefined;
const presentation = props.variant === "sheet" ? "sheet" : undefined;

function onValue(value: string | null, details: ChangeDetails) {
  record("value")(value, details);
  if (refusing) details.cancel();
}
function onAction(id: string, details: ChangeDetails) {
  record("action")(id, details);
  if (refusing) details.cancel();
}

onMounted(() => expose({ kindHost: host }));
</script>

<template>
  <div v-if="variant === 'plain'" class="p-6">
    <Picker
      id="picker"
      label="Branch"
      :items="[
        { value: 'main', label: 'main' },
        { value: 'dev', label: 'dev' },
      ]"
    />
  </div>
  <div v-else class="flex flex-col gap-4 p-6">
    <p id="above">Above</p>
    <div class="flex items-center gap-2">
      <Picker
        id="picker"
        label="Work in"
        :items="places"
        :actions="placeActions"
        :value="refusing ? 'kind-ui/agent-ui' : undefined"
        :default-value="refusing ? undefined : 'kind-ui/agent-ui'"
        :motion="motion"
        :presentation="presentation"
        @value-change="onValue"
        @action="onAction"
      />
      <span id="beside">Beside</span>
    </div>
  </div>
</template>
