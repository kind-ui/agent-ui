<script lang="ts">
export const variants = ["all", "feed"] as const;
</script>

<script setup lang="ts">
import type { RunEvent } from "@kind-ui/agent-ui";
import type { RunTimelineLoadDetails, RunTimelineLoadReason } from "@kind-ui/agent-ui/core";
import { onMounted, ref, shallowRef } from "vue";
import { RunTimeline } from "../../../../src/vue/run-timeline.js";
import { expose } from "../../shared/expose.js";
import { appended, earlier, events as initial } from "../../shared/run-timeline.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const feed = props.variant === "feed";
const events = shallowRef<RunEvent[]>(initial);
const busy = ref(false);
const hasMore = ref(!feed);
const loads: RunTimelineLoadReason[] = [];

function loadMore(details: RunTimelineLoadDetails) {
  loads.push(details.reason);
  busy.value = true;
}

onMounted(() =>
  expose({
    kindHost: {
      loads,
      append: () => {
        events.value = appended(events.value);
      },
      settle: () => {
        events.value = [earlier, ...events.value];
        hasMore.value = false;
        busy.value = false;
      },
    },
  }),
);
</script>

<template>
  <section id="run-timeline" class="w-[28rem] p-6">
    <RunTimeline
      :events="events"
      time-zone="UTC"
      :feed="feed"
      :order="feed ? 'newest-first' : 'oldest-first'"
      :busy="busy"
      :has-more="hasMore"
      @load-more="loadMore"
    />
  </section>
</template>
