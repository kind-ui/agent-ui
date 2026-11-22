<script lang="ts">
export const variants = ["all", "high", "full", "reduced", "german"] as const;
</script>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ContextMeter } from "../../../../src/vue/context-meter.js";
import { expose } from "../../shared/expose.js";
import { context, contextHost, levels } from "../../shared/context-meter.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const { host, record } = contextHost();
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
  <div class="flex flex-col items-start gap-4 p-6">
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
      />
      <span id="beside">Beside</span>
    </div>
  </div>
</template>
