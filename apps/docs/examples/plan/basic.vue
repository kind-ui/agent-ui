<script setup lang="ts">
import { ref } from "vue";
import { Plan } from "@/components/ui/vue/plan";

const accepted = ref(false);
</script>

<template>
  <Plan
    label="Move sessions to Redis"
    :status="accepted ? 'running' : 'awaiting-input'"
    :items="[
      { id: 'audit', status: 'complete', title: 'Find every session read and write' },
      {
        id: 'store',
        status: accepted ? 'running' : 'pending',
        title: 'Add a Redis session store',
        description: 'Behind a flag, so both stores run side by side.',
      },
      { id: 'migrate', status: 'pending', title: 'Copy the live sessions' },
      { id: 'cleanup', status: 'pending', title: 'Remove the old store' },
    ]"
    :accepted="accepted"
    @accept="accepted = true"
  />
</template>
