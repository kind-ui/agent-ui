<script lang="ts">
export const variants = ["all", "warning", "error", "reduced", "requests", "reset"] as const;
</script>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { UsageMeter } from "../../../../src/vue/usage-meter.js";
import { expose } from "../../shared/expose.js";
import { levels, requests, reset, usage, usageHost } from "../../shared/usage-meter.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const { host, record } = usageHost();
const used = ref<number>(
  props.variant === "warning"
    ? levels.warning
    : props.variant === "error"
      ? levels.error
      : props.variant === "requests"
        ? requests.used
        : usage.used,
);
const isRequests = props.variant === "requests";

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
      <UsageMeter
        id="usage"
        :used="used"
        :limit="isRequests ? requests.limit : usage.limit"
        :period="isRequests ? requests.period : usage.period"
        :breakdown="isRequests ? undefined : usage.breakdown"
        :unit="isRequests ? requests.unit : undefined"
        :label="isRequests ? requests.label : undefined"
        :reset-at="variant === 'reset' ? reset.resetAt : undefined"
        :motion="variant === 'reduced' ? 'reduced' : undefined"
        @open-change="record"
      />
      <span id="beside">Beside</span>
    </div>
  </div>
</template>
