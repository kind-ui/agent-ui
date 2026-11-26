<script setup lang="ts">
import { ref } from "vue";
import { QuotaNotice } from "@/components/ui/vue/quota-notice";

const used = ref(800);
const shown = ref(true);

const upgrade = () => window.alert("Upgrade");

const send = () => {
  shown.value = true;
  used.value = used.value >= 1000 ? 800 : used.value + 100;
};
</script>

<template>
  <div class="flex w-full max-w-xl flex-col items-start gap-3">
    <QuotaNotice
      v-if="shown"
      class="w-full"
      :used="used"
      :limit="1000"
      period="this month"
      now="2026-11-28T09:00:00Z"
      reset-at="2026-12-01T09:00:00Z"
      :on-upgrade="upgrade"
      :on-dismiss="() => (shown = false)"
    />
    <button
      type="button"
      class="rounded-md border border-[var(--kind-color-border)] px-2.5 py-1 text-sm"
      @click="send"
    >
      {{ used >= 1000 ? "Start over" : "Send 100 requests" }}
    </button>
  </div>
</template>
