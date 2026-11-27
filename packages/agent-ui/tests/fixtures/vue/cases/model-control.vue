<script lang="ts">
export const variants = ["cost", "all", "refusing"] as const;
</script>

<script setup lang="ts">
import { onMounted } from "vue";
import { ModelControl } from "../../../../src/vue/model-control.js";
import { expose } from "../../shared/expose.js";
import { controlHost, levels, modelActions, models, settings } from "../../shared/model-control.js";
import { costModels } from "../../shared/model-selector.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const { host, record } = controlHost();

function onModel(value: string, details: { reason: string; source?: string; cancel: () => void }) {
  record("model")(value, details);
  if (props.variant === "refusing") details.cancel();
}

function onEffort(value: string, details: { reason: string; source?: string; cancel: () => void }) {
  record("effort")(value, details);
  if (props.variant === "refusing") details.cancel();
}

const onAction = record("action");

function onValues(values: Record<string, unknown>, details: { id: string; reason: string; source?: string }) {
  record(details.id)(values[details.id], details);
}

onMounted(() => expose({ kindHost: host }));
</script>

<template>
  <div v-if="variant === 'cost'" class="p-6">
    <ModelControl id="control" :models="costModels" default-model="claude-sonnet-5.5" default-open />
  </div>
  <div v-else class="p-6">
    <ModelControl
      id="control"
      :models="models"
      :levels="levels"
      :settings="settings"
      default-model="opus"
      default-effort="medium"
      :default-values="{ fast: false, context: '1m' }"
      :actions="modelActions"
      @action="onAction"
      @model-change="onModel"
      @effort-change="onEffort"
      @values-change="onValues"
    />
  </div>
</template>
