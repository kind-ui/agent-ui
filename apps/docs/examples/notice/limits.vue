<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Notice } from "@/components/ui/vue/notice";

const HOUR = 3_600_000;

// Resets are relative to now, which only the browser knows, so the server renders the notices without them.
const now = ref<number>();
onMounted(() => {
  now.value = Date.now();
});
const at = (hours: number) =>
  now.value === undefined ? undefined : new Date(now.value + hours * HOUR).toISOString();
const warned = ref(true);
</script>

<template>
  <div class="flex w-full max-w-xl flex-col gap-3">
    <Notice
      v-if="warned"
      variant="warning"
      label="12 requests left"
      :resets-at="at(76)"
      :on-dismiss="() => (warned = false)"
    >
      You've used most of this week's requests.
      <template #actions>
        <button type="button" data-kind-button="secondary">Upgrade</button>
      </template>
    </Notice>
    <button v-else type="button" data-kind-button="secondary" class="self-start" @click="warned = true">
      Show the warning again
    </button>
    <Notice variant="error" label="You've reached your weekly limit" :resets-at="at(0.7)">
      New runs pause until then.
      <template #actions>
        <button type="button" data-kind-button="secondary">Continue at reset</button>
        <button type="button" data-kind-button="secondary">Switch to Claude Sonnet 5.5</button>
        <button type="button" data-kind-button="primary">Use credits</button>
      </template>
    </Notice>
  </div>
</template>
