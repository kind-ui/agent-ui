<script lang="ts">
export const variants = ["box"] as const;
</script>

<script setup lang="ts">
import { enter, exit, layout } from "@kind-ui/agent-ui/core";
import { onMounted } from "vue";
import { expose } from "../../shared/expose.js";

defineProps<{ variant: string; params: URLSearchParams }>();

onMounted(() => expose({ kindMotion: { enter, exit, layout } }));
</script>

<template>
  <div id="box" class="h-16 w-16 bg-[rgb(1,2,3)]">
    <span data-dot>.</span>
    <span data-dot>.</span>
    <span data-dot>.</span>
  </div>
</template>
