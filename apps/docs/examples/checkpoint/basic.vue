<script setup lang="ts">
import { ref } from "vue";
import { Checkpoint } from "@/components/ui/vue/checkpoint";

const restored = ref(false);
const restore = () =>
  new Promise<void>((resolve) => setTimeout(resolve, 800)).then(() => {
    restored.value = true;
  });
</script>

<template>
  <Checkpoint
    class="w-full max-w-md"
    description="Before editing auth.ts"
    :restored="restored"
    :on-restore="restore"
  />
</template>
