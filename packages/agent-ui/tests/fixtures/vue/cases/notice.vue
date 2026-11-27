<script lang="ts">
export const variants = ["quota", "all", "fallback", "reduced"] as const;
</script>

<script setup lang="ts">
import { onMounted, shallowRef } from "vue";
import { Notice } from "../../../../src/vue/notice.js";
import { expose } from "../../shared/expose.js";
import { added, type NoticeData, noticeHost, notices, quotaNotices } from "../../shared/notice.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const { host, dismissed } = noticeHost();
const items = shallowRef(notices);
const quota = props.variant === "quota" ? quotaNotices() : [];
const motion = props.variant === "reduced" ? "reduced" : undefined;
const focusFallback = props.variant === "fallback" ? () => document.getElementById("above") : undefined;

const dismiss = (item: NoticeData) =>
  item.dismissible
    ? async () => {
        await dismissed(item.id);
        items.value = items.value.filter((other) => other.id !== item.id);
      }
    : undefined;

onMounted(() =>
  expose({
    kindHost: Object.assign(host, {
      add: () => {
        items.value = [...items.value, added];
      },
      remove: () => {
        items.value = items.value.filter((item) => item.id !== "error");
      },
      escalate: () => {
        items.value = items.value.map((item) => (item.id === "info" ? { ...item, variant: "error" } : item));
      },
      edit: () => {
        items.value = items.value.map((item) => (item.id === "info" ? { ...item, text: "Almost done." } : item));
      },
    }),
  }),
);
</script>

<template>
  <div v-if="variant === 'quota'" class="flex w-[36rem] flex-col gap-3 p-6">
    <Notice
      v-for="item in quota"
      :id="`notice-${item.id}`"
      :key="item.id"
      :variant="item.variant"
      :label="item.label"
      :resets-at="item.resetsAt"
      :on-dismiss="() => dismissed(item.id)"
    >
      {{ item.text }}
      <template #actions>
        <button
          v-for="(action, index) in item.actions"
          :key="action"
          type="button"
          :data-kind-button="index === item.actions.length - 1 ? 'secondary' : ''"
        >
          {{ action }}
        </button>
      </template>
    </Notice>
  </div>
  <div v-else class="flex w-[30rem] flex-col gap-3 p-6">
    <button id="above" type="button">Above</button>
    <Notice
      v-for="item in items"
      :id="`notice-${item.id}`"
      :key="item.id"
      :variant="item.variant"
      :label="item.label"
      :motion="motion"
      :on-dismiss="dismiss(item)"
      :dismissible="item.dismissible"
      :focus-fallback="focusFallback"
    >
      {{ item.text }}
      <template v-if="item.action" #actions>
        <button type="button">{{ item.action }}</button>
      </template>
    </Notice>
    <button id="below" type="button">Below</button>
  </div>
</template>
