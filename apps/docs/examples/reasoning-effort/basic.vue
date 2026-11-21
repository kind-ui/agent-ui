<script setup lang="ts">
import { ref } from "vue";
import { ReasoningEffort } from "@/components/ui/vue/reasoning-effort";

const effort = ref<string | null>("medium");
</script>

<template>
  <ReasoningEffort v-model:value="effort" />
</template>
