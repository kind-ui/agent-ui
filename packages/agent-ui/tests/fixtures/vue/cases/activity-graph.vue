<script lang="ts">
export const variants = ["all", "read-only", "monday", "rtl", "narrow", "hydrate"] as const;
</script>

<script setup lang="ts">
import { createSSRApp, h, onBeforeUnmount, onMounted, useTemplateRef } from "vue";
import { renderToString } from "vue/server-renderer";
import { ActivityGraph } from "../../../../src/vue/activity-graph.js";
import { activityDays, activityHost, activityNow } from "../../shared/activity-graph.js";
import { expose } from "../../shared/expose.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const { host, record } = activityHost();
const hostEl = useTemplateRef<HTMLDivElement>("hostEl");
let cleanup = () => {};

// Server markup ends with the data's last day and today's date in the browser, so it moves as it hydrates.
onMounted(async () => {
  expose({ kindHost: host });
  if (props.variant !== "hydrate") return;
  const container = document.createElement("div");
  container.id = "hydrated";
  hostEl.value?.append(container);
  const graph = () => h(ActivityGraph, { days: activityDays.slice(7), timeZone: "UTC", weeks: 20 });
  const errors: string[] = [];
  container.innerHTML = await renderToString(createSSRApp(graph));
  expose({ kindServerMarkup: container.innerHTML, kindHydrationErrors: errors });
  const app = createSSRApp(graph);
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
  <div v-if="props.variant === 'hydrate'" ref="hostEl" />
  <div v-else class="bg-[var(--kind-color-surface)] p-6">
    <ActivityGraph
      v-if="props.variant === 'all'"
      :days="activityDays"
      :now="activityNow"
      time-zone="UTC"
      @select="record"
    />
    <ActivityGraph v-else-if="props.variant === 'read-only'" :days="activityDays" :now="activityNow" time-zone="UTC" />
    <ActivityGraph
      v-else-if="props.variant === 'monday'"
      :days="activityDays"
      :now="activityNow"
      time-zone="UTC"
      :week-start="1"
      :weeks="8"
      unit="tokens"
      unit-one="token"
      label="Tokens"
      @select="record"
    />
    <div v-else-if="props.variant === 'rtl'" dir="rtl">
      <ActivityGraph :days="activityDays" :now="activityNow" time-zone="UTC" @select="record" />
    </div>
    <div v-else-if="props.variant === 'narrow'" style="width: 320px">
      <ActivityGraph :days="activityDays" :now="activityNow" time-zone="UTC" />
    </div>
  </div>
</template>
