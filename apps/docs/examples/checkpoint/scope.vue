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
    description="Before “Switch to the session table”, 4 min ago."
    :scopes="['both', 'code', 'conversation']"
    :changes="{ files: 3, additions: 12, deletions: 40 }"
    :later-messages="4"
    :unrestorable-messages="2"
    :restored="restored"
    :on-restore="restore"
  />
</template>
