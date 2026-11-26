<script lang="ts">
export const variants = ["all", "down", "reduced"] as const;
</script>

<script setup lang="ts">
import { onMounted, shallowRef } from "vue";
import { FlowGraph } from "../../../../src/vue/flow-graph.js";
import { expose } from "../../shared/expose.js";
import { advanced, type FlowGraphHost, flowEdges, flowNodes } from "../../shared/flow-graph.js";
import { useFlush } from "./flush.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const known = (variants as readonly string[]).includes(props.variant);
const direction = props.variant === "down" ? "down" : undefined;
const motion = props.variant === "reduced" ? "reduced" : undefined;
const changes: FlowGraphHost["changes"] = [];
const nodes = shallowRef(flowNodes);
const flush = useFlush();

const changed = (value: string | null, details: { reason: string; source?: string }) => {
  changes.push({ value, reason: details.reason, source: details.source });
};

onMounted(() => {
  const host: FlowGraphHost = {
    changes,
    advance: () =>
      flush(() => {
        nodes.value = advanced(nodes.value);
      }),
  };
  expose({ kindHost: host });
});
</script>

<template>
  <p v-if="!known" data-no-case>No case</p>
  <div v-else class="w-[36rem] p-6">
    <FlowGraph
      id="flow"
      label="Refund flow"
      :nodes="nodes"
      :edges="flowEdges"
      :direction="direction"
      :motion="motion"
      @value-change="changed"
    />
  </div>
</template>
