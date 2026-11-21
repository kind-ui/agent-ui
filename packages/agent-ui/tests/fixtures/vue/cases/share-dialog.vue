<script lang="ts">
export const variants = ["all", "linked", "unconfirmed", "reduced", "refusing"] as const;
</script>

<script setup lang="ts">
import type { ShareDialogActionDetails, ShareVisibility } from "@kind-ui/agent-ui/core";
import type { ChangeDetails } from "@ui-sdk/core";
import { onMounted, shallowRef } from "vue";
import { ShareDialog } from "../../../../src/vue/share-dialog.js";
import { expose } from "../../shared/expose.js";
import { shareDialogHost, shareLink } from "../../shared/share-dialog.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const { host, call, answer } = shareDialogHost();
const linked = props.variant === "linked";
const refusing = props.variant === "refusing";
const agentConfirm = props.variant === "unconfirmed" ? false : undefined;
const motion = props.variant === "reduced" ? "reduced" : undefined;

const visibility = shallowRef<ShareVisibility>(linked ? "link" : "private");
const link = shallowRef<string | undefined>(linked ? shareLink : undefined);

function onVisibility(value: ShareVisibility, details: ChangeDetails) {
  host.visibilities.push({ value, reason: details.reason, source: details.source });
  if (!refusing) visibility.value = value;
}
const onCreate = (details: ShareDialogActionDetails) => call("create", details);
const onRevoke = (details: ShareDialogActionDetails) => call("revoke", details);
const onCopy = (value: string, details: ChangeDetails) => host.copies.push({ link: value, reason: details.reason });

onMounted(() => {
  answer((action) => {
    if (action === "create") {
      link.value = shareLink;
      return;
    }
    link.value = undefined;
    visibility.value = "private";
  });
  expose({ kindHost: host });
});
</script>

<template>
  <div class="w-[30rem] p-6">
    <ShareDialog
      id="share"
      :visibility="visibility"
      :link="link"
      :on-create-link="onCreate"
      :on-revoke="onRevoke"
      :agent-confirm="agentConfirm"
      :motion="motion"
      @visibility-change="onVisibility"
      @copy="onCopy"
    />
  </div>
</template>
