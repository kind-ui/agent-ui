<script setup lang="ts">
import { Status } from "@/components/ui/vue/status";
</script>

<template>
  <ul class="flex w-72 flex-col gap-2 text-sm">
    <li class="flex items-center justify-between gap-3">
      Build
      <Status status="complete" />
    </li>
    <li class="flex items-center justify-between gap-3">
      Deploy to staging
      <Status status="running" />
    </li>
    <li class="flex items-center justify-between gap-3">
      Approve release
      <Status status="awaiting-input" />
    </li>
  </ul>
</template>
