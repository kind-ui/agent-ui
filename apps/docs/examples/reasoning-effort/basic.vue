<script setup lang="ts">
import { ref } from "vue";
import { ReasoningEffort } from "@/components/ui/vue/reasoning-effort";

const effort = ref<string | null>("medium");
</script>

<template>
  <ReasoningEffort :value="effort" @value-change="(value) => (effort = value)" />
</template>
