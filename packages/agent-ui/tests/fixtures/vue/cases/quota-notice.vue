<script lang="ts">
export const variants = ["all", "clock"] as const;
</script>

<script setup lang="ts">
import type { QuotaNoticeUpgradeDetails } from "@kind-ui/agent-ui/core";
import { onMounted, ref } from "vue";
import { QuotaNotice } from "../../../../src/vue/quota-notice.js";
import { expose } from "../../shared/expose.js";
import { clock, quota, quotaHost, spent } from "../../shared/quota-notice.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const host = quotaHost();
const used = ref(quota.used);
const shown = ref(true);
const reset = props.variant === "clock" ? { resetAt: clock.resetAt } : { resetAt: quota.resetAt, now: quota.now };

const upgrade = (details: QuotaNoticeUpgradeDetails) => host.upgrades.push(details.source);
const dismiss = () => {
  host.dismisses += 1;
  shown.value = false;
};

onMounted(() =>
  expose({
    kindHost: Object.assign(host, {
      setUsed: (value: number) => {
        used.value = value;
      },
    }),
  }),
);
</script>

<template>
  <div class="flex w-[30rem] flex-col gap-3 p-6">
    <button id="above" type="button">Above</button>
    <QuotaNotice
      v-if="shown"
      id="quota"
      :used="used"
      :limit="quota.limit"
      :period="quota.period"
      v-bind="reset"
      :on-upgrade="upgrade"
      :on-dismiss="dismiss"
    />
    <QuotaNotice id="quota-spent" :used="spent.used" :limit="spent.limit" :unit="spent.unit"
      >Answers use a smaller model until your plan renews.</QuotaNotice
    >
    <button id="below" type="button">Below</button>
  </div>
</template>
