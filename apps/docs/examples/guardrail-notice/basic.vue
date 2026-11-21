<script setup lang="ts">
import { ref } from "vue";
import { GuardrailNotice } from "@/components/ui/vue/guardrail-notice";

const shown = ref(true);
</script>

<template>
  <div class="flex w-full max-w-xl flex-col gap-3">
    <GuardrailNotice
      v-if="shown"
      blocking
      label="Model output withheld"
      reason="The response included personal data."
      detail="Your organization's policy blocks responses that contain email addresses or phone numbers."
      :on-dismiss="() => (shown = false)"
    />
    <button
      v-else
      type="button"
      class="self-start rounded-md border border-[var(--kind-color-border)] px-2.5 py-1 text-sm"
      @click="shown = true"
    >
      Show the notice again
    </button>
    <GuardrailNotice
      variant="info"
      label="Some results hidden"
      reason="Two search results matched a content filter."
      detail="Filtered results come from sites your organization has blocked."
    />
  </div>
</template>
