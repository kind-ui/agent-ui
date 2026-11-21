<script lang="ts">
export const variants = ["mixed"] as const;
</script>

<script setup lang="ts">
import type { MotionMode, UploadItem } from "@kind-ui/agent-ui/core";
import { onMounted, shallowRef } from "vue";
import { Uploader } from "../../../../src/vue/uploader.js";
import { expose } from "../../shared/expose.js";
import { uploadHost, uploads } from "../../shared/uploader.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const items = shallowRef<readonly UploadItem[]>(uploads);
const { fixture, onFiles, onReject, onCancel, onRetry } = uploadHost((change) => {
  items.value = change(items.value);
});
const motion = (props.params.get("motion") as MotionMode | null) ?? undefined;

onMounted(() => expose({ kindUploader: fixture }));
</script>

<template>
  <div class="mx-auto max-w-lg p-6">
    <Uploader
      aria-label="Uploads"
      :items="items"
      :max-size="5_000_000"
      :motion="motion"
      @files="onFiles"
      @reject="onReject"
      @cancel="onCancel"
      @retry="onRetry"
    />
  </div>
</template>
