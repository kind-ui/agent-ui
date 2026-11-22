<script lang="ts">
export const variants = ["all", "reduced"] as const;
</script>

<script setup lang="ts">
import type { GeneratedImageStatus, MotionMode } from "@kind-ui/agent-ui/core";
import { onMounted, shallowRef } from "vue";
import { GeneratedImage } from "../../../../src/vue/generated-image.js";
import { expose } from "../../shared/expose.js";
import { lighthouse, missing, preview, size } from "../../shared/generated-image.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

type Settle = { resolve(): void; reject(): void };

const recorded: { downloads: string[]; settle?: Settle } = { downloads: [] };
const motion: MotionMode | undefined = props.variant === "reduced" ? "reduced" : undefined;

const status = shallowRef<GeneratedImageStatus>("generating");
const progress = shallowRef<number | undefined>(40);
const src = shallowRef<string>();
const previewUrl = shallowRef<string | undefined>(preview);

const download = (details: { source: string }) => {
  recorded.downloads.push(details.source);
  return new Promise<void>((resolve, reject) => {
    recorded.settle = { resolve, reject };
  });
};

onMounted(() =>
  expose({
    kindHost: {
      downloads: recorded.downloads,
      resolve: () => recorded.settle?.resolve(),
      reject: () => recorded.settle?.reject(),
      progress: (value: number | undefined) => {
        progress.value = value;
      },
      preview: (show: boolean) => {
        previewUrl.value = show ? preview : undefined;
      },
      ready: (url: string) => {
        src.value = url;
        status.value = "ready";
      },
      fail: () => {
        status.value = "error";
      },
      generate: () => {
        status.value = "generating";
      },
      missing,
    },
  }),
);
</script>

<template>
  <div v-if="variant === 'all' || variant === 'reduced'" class="flex w-[30rem] flex-col gap-4 p-6">
    <GeneratedImage
      id="lifecycle"
      alt="A lighthouse at night"
      :status="status"
      :progress="progress"
      :preview="previewUrl"
      :src="src"
      v-bind="size"
      :motion="motion"
    />
    <GeneratedImage
      id="loaded"
      alt="A lighthouse at dusk"
      :src="lighthouse"
      v-bind="size"
      :on-download="download"
      :motion="motion"
    />
    <GeneratedImage
      id="failed"
      alt="A lighthouse in a storm"
      status="error"
      error="Generation timed out."
      v-bind="size"
      :motion="motion"
    />
  </div>
  <p v-else data-no-case>No case</p>
</template>
