<script lang="ts">
export const variants = ["all", "hydrate"] as const;
</script>

<script setup lang="ts">
import { createSSRApp, h, onBeforeUnmount, onMounted, useTemplateRef } from "vue";
import { renderToString } from "vue/server-renderer";
import { DaySeparator } from "../../../../src/vue/day-separator.js";
import { expose } from "../../shared/expose.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const host = useTemplateRef<HTMLDivElement>("host");
let cleanup = () => {};

onMounted(async () => {
  if (props.variant !== "hydrate") return;
  const container = document.createElement("div");
  container.id = "hydrated";
  host.value?.append(container);
  const separator = () => h(DaySeparator, { date: "2026-11-18T09:30:00Z", timeZone: "UTC" });
  const errors: string[] = [];
  container.innerHTML = await renderToString(createSSRApp(separator));
  expose({ kindServerMarkup: container.innerHTML, kindHydrationErrors: errors });
  const app = createSSRApp(separator);
  app.config.warnHandler = (message) => {
    if (/hydration/i.test(message)) errors.push(message);
  };
  app.mount(container);
  cleanup = () => {
    app.unmount();
    container.remove();
  };
});
onBeforeUnmount(() => cleanup());
</script>

<template>
  <div v-if="props.variant === 'hydrate'" ref="host" />
  <div v-else class="flex flex-col gap-3 p-6">
    <DaySeparator id="today" date="2026-11-18T09:30:00Z" time-zone="UTC" />
    <DaySeparator id="yesterday" date="2026-11-17T09:30:00Z" time-zone="UTC" />
    <DaySeparator id="weekday" date="2026-11-13T09:30:00Z" time-zone="UTC" />
    <DaySeparator id="older" date="2026-10-02T09:30:00Z" time-zone="UTC" />
    <DaySeparator id="level" date="2026-10-02" time-zone="UTC" :level="2" />
    <DaySeparator id="absolute" date="2026-11-18T09:30:00Z" time-zone="UTC" :relative="false" />
    <DaySeparator id="late-utc" date="2026-11-17T23:30:00Z" time-zone="UTC" />
    <DaySeparator id="late-tokyo" date="2026-11-17T23:30:00Z" time-zone="Asia/Tokyo" />
    <DaySeparator id="undated" time-zone="UTC" />
  </div>
</template>
