<script lang="ts">
export const variants = ["all", "fallback", "reduced"] as const;
</script>

<script setup lang="ts">
import { onMounted, shallowRef } from "vue";
import { Notice } from "../../../../src/vue/notice.js";
import { expose } from "../../shared/expose.js";
import { added, type NoticeData, noticeHost, notices } from "../../shared/notice.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const { host, dismissed } = noticeHost();
const items = shallowRef(notices);
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
  <div class="flex w-[30rem] flex-col gap-3 p-6">
    <button id="above" type="button">Above</button>
    <Notice
      v-for="item in items"
      :id="`notice-${item.id}`"
      :key="item.id"
      :variant="item.variant"
      :label="item.label"
      :motion="motion"
      :on-dismiss="dismiss(item)"
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
