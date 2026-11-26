<script lang="ts">
import type { AgentAction } from "@ui-sdk/vue/agent";
import { confirmationHost, moreConfirmations } from "../../shared/confirmation.js";

export const variants = ["all", "reduced"] as const;

const { host, approve, deny, always } = confirmationHost();
const more = moreConfirmations();

export const allow = (step: AgentAction) => !step.confirm || host.permit;
</script>

<script setup lang="ts">
import type { Approval } from "@kind-ui/agent-ui";
import { onMounted, shallowRef } from "vue";
import { Confirmation } from "../../../../src/vue/confirmation.js";
import { expose } from "../../shared/expose.js";
import { request } from "../../shared/confirmation.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const approvals = shallowRef({ confirm: request("requested"), reason: request("requested") });
const motion = props.variant === "reduced" ? "reduced" : undefined;
const approveOnly = request("requested");
const auto = request("auto", 1, { approved: true });

onMounted(() =>
  expose({
    kindHost: host,
    kindApproval: {
      set: (next: Approval, id: "confirm" | "reason" = "confirm") => {
        approvals.value = { ...approvals.value, [id]: next };
      },
    },
  }),
);
</script>

<template>
  <div class="flex w-full max-w-[28rem] flex-col gap-4 p-6">
    <p id="above">Above</p>
    <Confirmation
      id="confirm"
      label="Run search_docs?"
      :approval="approvals.confirm"
      :on-approve="approve"
      :on-deny="deny"
      :motion="motion"
    />
    <p id="below">Below</p>
    <Confirmation
      id="reason"
      label="Delete notes.md?"
      :approval="approvals.reason"
      :on-approve="approve"
      :on-deny="deny"
      reason
    />
    <Confirmation id="approve-only" label="Open the link?" :approval="approveOnly" :on-approve="approve" />
    <Confirmation id="auto" label="Read README.md?" :approval="auto" :on-approve="approve" :on-deny="deny" />
    <Confirmation
      v-for="{ id, options } in more"
      :id="id"
      :key="id"
      v-bind="options"
      :on-approve="approve"
      :on-deny="deny"
      :on-always-allow="options.alwaysTarget ? always : undefined"
      :motion="motion"
    />
  </div>
</template>
