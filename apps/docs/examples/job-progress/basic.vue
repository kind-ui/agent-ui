<script setup lang="ts">
import { JobProgress } from "@/components/ui/vue/job-progress";
</script>

<template>
  <JobProgress
    label="Build docs"
    status="running"
    :value="0.42"
    stage="Installing dependencies"
    :stage-index="2"
    :stage-count="7"
    started-at="2026-11-25T12:00:00Z"
    now="2026-11-25T12:02:00Z"
    :eta-seconds="60"
    :default-open="false"
  >
    <pre>{{ "$ npm ci\nadded 491 packages in 40s" }}</pre>
  </JobProgress>
</template>
