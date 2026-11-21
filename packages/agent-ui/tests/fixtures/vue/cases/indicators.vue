<script lang="ts">
export const variants = ["all"] as const;
</script>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Loader } from "../../../../src/vue/loader.js";
import { StreamingText } from "../../../../src/vue/streaming-text.js";
import { ThinkingIndicator } from "../../../../src/vue/thinking-indicator.js";
import { TypingIndicator } from "../../../../src/vue/typing-indicator.js";
import { expose } from "../../shared/expose.js";

defineProps<{ variant: string; params: URLSearchParams }>();

const text = ref("Streaming text fades in");
onMounted(() => expose({ kindStream: { set: (next: string) => (text.value = next) } }));
</script>

<template>
  <div class="flex max-w-md flex-col items-start gap-6 p-6">
    <Loader />
    <ThinkingIndicator />
    <TypingIndicator />
    <p class="text-sm leading-6">
      <StreamingText :text="text" caret />
    </p>
  </div>
</template>
