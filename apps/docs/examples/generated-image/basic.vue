<script setup lang="ts">
import { onWatcherCleanup, ref, watch } from "vue";
import { GeneratedImage } from "@/components/ui/vue/generated-image";
import lighthouse from "./lighthouse.png";
import preview from "./lighthouse-preview.png";

const progress = ref(0);

watch(
  progress,
  (value) => {
    if (value >= 100) return;
    const timer = setTimeout(() => (progress.value = value + 5), 250);
    onWatcherCleanup(() => clearTimeout(timer));
  },
  { immediate: true },
);

function save() {
  const link = document.createElement("a");
  link.href = lighthouse;
  link.download = "lighthouse.png";
  link.click();
}
</script>

<template>
  <div class="flex w-full max-w-md flex-col items-start gap-3">
    <GeneratedImage
      alt="A lighthouse at dusk"
      :status="progress < 100 ? 'generating' : 'ready'"
      :progress="progress"
      :preview="progress >= 30 ? preview : undefined"
      :src="lighthouse"
      :width="768"
      :height="512"
      :on-download="save"
      class="w-full"
    />
    <button
      type="button"
      class="rounded-md border border-[var(--kind-color-border)] px-2.5 py-1 text-sm hover:bg-[var(--kind-color-hover)]"
      @click="progress = 0"
    >
      Replay
    </button>
  </div>
</template>
