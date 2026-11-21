<script lang="ts">
export const variants = ["all", "reduced", "refusing", "unconfirmed", "learning"] as const;
</script>

<script setup lang="ts">
import { onMounted, shallowRef } from "vue";
import { ApprovalMode } from "../../../../src/vue/approval-mode.js";
import { approvalModeHost, initialValue, learnMoreHref, modes } from "../../shared/approval-mode.js";
import { expose } from "../../shared/expose.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const { host, change, learn } = approvalModeHost();
const value = shallowRef(initialValue);

function onValue(next: string, details: { reason: string; source?: string; cancel: () => void }) {
  change(next, details);
  if (props.variant === "refusing") details.cancel();
  else value.value = next;
}

onMounted(() => expose({ kindHost: host }));
</script>

<template>
  <div class="p-6">
    <ApprovalMode
      :modes="modes"
      :value="value"
      :learn-more-href="variant === 'learning' ? undefined : learnMoreHref"
      :on-learn-more="variant === 'learning' ? learn : undefined"
      :motion="variant === 'reduced' ? 'reduced' : undefined"
      :agent-confirm="variant === 'unconfirmed' ? false : undefined"
      @value-change="onValue"
    />
  </div>
</template>
