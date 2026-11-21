<script setup lang="ts">
import { Reasoning } from "@/components/ui/vue/reasoning";
</script>

<template>
  <div class="flex flex-col gap-1">
    <Reasoning
      status="complete"
      :duration-seconds="4"
      text="The user wants the **cheapest** route. Compare the three fares, then check the layovers."
    />
    <Reasoning status="running" text="Two of the flights leave before 7 a.m., so rank the third one first." />
  </div>
</template>
