<script setup lang="ts">
import { Status } from "@/components/ui/vue/status";
import { Step, StepIcon, StepMeta, StepTitle, StepTrigger } from "@/components/ui/vue/step";
import { ThinkingIndicator } from "@/components/ui/vue/thinking-indicator";

// The last update arrived three minutes ago.
const lastActivityAt = new Date(Date.now() - 3 * 60_000).toISOString();
</script>

<template>
  <div class="flex w-full max-w-md flex-col items-start gap-4">
    <Step status="running" :last-activity-at="lastActivityAt" class="w-full">
      <StepTrigger>
        <StepIcon />
        <StepTitle>Searching the docs</StepTitle>
        <StepMeta>3 min</StepMeta>
      </StepTrigger>
    </Step>
    <Status status="running" label="Deploying to staging" :last-activity-at="lastActivityAt" />
    <ThinkingIndicator :last-activity-at="lastActivityAt" />
  </div>
</template>
