<script lang="ts">
export const variants = ["all", "reduced", "refused"] as const;
</script>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { GuardrailNotice } from "../../../../src/vue/guardrail-notice.js";
import { expose } from "../../shared/expose.js";
import { guardrails, noticeHost } from "../../shared/notice.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const { host, dismissed } = noticeHost();
const shown = ref({ blocking: true, filtered: true, late: false });
const motion = props.variant === "reduced" ? "reduced" : undefined;
const refused = props.variant === "refused";

const dismiss = (id: keyof typeof shown.value) => async () => {
  await dismissed(id);
  shown.value = { ...shown.value, [id]: false };
};
const refuse = (_open: boolean, details: { reason: string }) => host.openings.push(details.reason);

onMounted(() =>
  expose({
    kindHost: Object.assign(host, {
      add: () => {
        shown.value = { ...shown.value, late: true };
      },
    }),
  }),
);
</script>

<template>
  <div class="flex w-[30rem] flex-col gap-3 p-6">
    <button id="above" type="button">Above</button>
    <GuardrailNotice
      v-if="shown.blocking"
      id="guardrail-blocking"
      v-bind="guardrails.blocking"
      blocking
      :motion="motion"
      :on-dismiss="dismiss('blocking')"
      :open="refused ? false : undefined"
      v-on="refused ? { openChange: refuse } : {}"
    />
    <GuardrailNotice
      v-if="shown.filtered"
      id="guardrail-filtered"
      variant="info"
      v-bind="guardrails.filtered"
      :motion="motion"
    />
    <GuardrailNotice
      v-if="shown.late"
      id="guardrail-late"
      label="Request blocked"
      reason="The prompt asked for malware."
      blocking
    />
    <button id="below" type="button">Below</button>
  </div>
</template>
