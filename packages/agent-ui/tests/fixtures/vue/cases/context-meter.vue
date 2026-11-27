<script lang="ts">
export const variants = [
  "all",
  "high",
  "full",
  "reduced",
  "german",
  "breakdown",
  "limits",
  "near-cap",
  "compacting",
  "inline",
] as const;
</script>

<script setup lang="ts">
import type { ContextMeterOptions } from "@kind-ui/agent-ui/core";
import { computed, onMounted, ref } from "vue";
import { ContextMeter } from "../../../../src/vue/context-meter.js";
import { expose } from "../../shared/expose.js";
import { context, contextHost, levels, meterCases } from "../../shared/context-meter.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const { host, record, compact } = contextHost();
const extra = computed((): ContextMeterOptions | undefined => {
  const options = meterCases[props.variant as keyof typeof meterCases];
  return options && { onCompact: compact, ...options };
});
const used = ref<number>(
  props.variant === "high" ? levels.high : props.variant === "full" ? levels.full : context.used,
);

onMounted(() =>
  expose({
    kindHost: {
      ...host,
      setUsed: (value: number) => {
        used.value = value;
      },
    },
  }),
);
</script>

<template>
  <div :class="['flex flex-col items-start gap-4 p-6', extra?.layout === 'inline' && 'w-[32rem]']">
    <p id="above">Above</p>
    <div class="flex items-center gap-2">
      <ContextMeter
        id="context"
        :total="context.total"
        :usage="context.usage"
        :cost="context.cost"
        :used="used"
        :motion="variant === 'reduced' ? 'reduced' : undefined"
        :locale="variant === 'german' ? 'de-DE' : undefined"
        @open-change="record"
        v-bind="extra"
      />
      <span id="beside">Beside</span>
    </div>
  </div>
</template>
