<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { StreamingText } from "@/components/ui/vue/streaming-text";

const reply =
  "The three timeouts all come from the same upstream call. Adding a retry with backoff should cover them.";
const words = reply.split(/(?<= )/);

const count = ref(0);
const text = computed(() => words.slice(0, count.value).join(""));
let timer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  timer = setInterval(() => {
    count.value = count.value > words.length + 8 ? 0 : count.value + 1;
  }, 120);
});
onBeforeUnmount(() => clearInterval(timer));
</script>

<template>
  <p class="max-w-md">
    <StreamingText :text="text" :caret="count < words.length" />
  </p>
</template>
