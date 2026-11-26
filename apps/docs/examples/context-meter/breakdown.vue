<script setup lang="ts">
import { ContextMeter } from "@/components/ui/vue/context-meter";
</script>

<template>
  <ContextMeter
    :used="57_600"
    :total="128_000"
    :breakdown="[
      { id: 'system', label: 'System', value: 8_000 },
      { id: 'tools', label: 'Tools', value: 12_000 },
      { id: 'messages', label: 'Messages', value: 30_000 },
      { id: 'files', label: 'Files', value: 7_600 },
    ]"
  />
</template>
