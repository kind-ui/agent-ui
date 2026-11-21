<script lang="ts">
export const variants = ["refused", "all", "reduced", "streaming"] as const;
</script>

<script setup lang="ts">
import type { MotionMode } from "@kind-ui/agent-ui/core";
import { computed, onMounted, shallowRef, watch } from "vue";
import { Document } from "../../../../src/vue/document.js";
import { expose } from "../../shared/expose.js";
import { chunks, code, downloads, notes, readme } from "../../shared/document.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const motion: MotionMode | undefined = props.variant === "reduced" ? "reduced" : undefined;
const page = props.variant === "all" || props.variant === "reduced";

const recorded: { downloads: [string | undefined, string][] } = { downloads: [] };
const download = (id: string | undefined, details: { source: string }) =>
  void recorded.downloads.push([id, details.source]);

const count = shallowRef(0);
const streamed = computed(() => chunks.slice(0, count.value).join(""));

const openings = shallowRef<string[]>([]);
let settle: { resolve: () => void; reject: () => void } | undefined;
const refusedDownload = () =>
  (window as unknown as { kindDownload(): Promise<void> }).kindDownload();
const openChange = (open: boolean, details: { reason: string }) => {
  openings.value = [...openings.value, `${open}:${details.reason}`];
};
const copy = (_content: string, details: { cancel(): void }) => details.cancel();

const exposeRefused = () =>
  expose({
    kindHost: {
      openings: openings.value,
      resolve: () => settle?.resolve(),
      reject: () => settle?.reject(),
    },
    kindDownload: () =>
      new Promise<void>((resolve, reject) => {
        settle = { resolve, reject };
      }),
  });

onMounted(() => {
  if (page) expose({ kindHost: recorded });
  else if (props.variant === "streaming")
    expose({
      kindHost: {
        next: () => {
          count.value = Math.min(count.value + 1, chunks.length);
        },
      },
    });
  else if (props.variant === "refused") exposeRefused();
});

watch(openings, () => {
  if (props.variant === "refused") exposeRefused();
});
</script>

<template>
  <div v-if="page" class="flex w-[34rem] flex-col gap-4 p-6">
    <Document
      id="readme"
      label="README.md"
      :content="readme"
      :downloads="downloads"
      :on-download="download"
      :motion="motion"
    />
    <Document id="code" label="backoff.ts" format="code" language="ts" :content="code" />
    <Document id="notes" label="notes.txt" format="text" :content="notes" />
  </div>
  <div v-else-if="variant === 'streaming'" class="w-[34rem] p-6">
    <Document
      id="streaming"
      label="README.md"
      :content="streamed"
      :streaming="count < chunks.length"
      :on-download="() => {}"
    />
  </div>
  <div v-else-if="variant === 'refused'" class="w-[34rem] p-6">
    <Document
      id="readme"
      label="README.md"
      :content="readme"
      :open="false"
      :on-download="refusedDownload"
      @open-change="openChange"
      @copy="copy"
    />
  </div>
  <p v-else data-no-case>No case</p>
</template>
