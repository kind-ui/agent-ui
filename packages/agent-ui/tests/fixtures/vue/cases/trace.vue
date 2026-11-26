<script lang="ts">
export const variants = ["all", "running", "reduced", "refused", "many-50", "many-5000"] as const;
</script>

<script setup lang="ts">
import type { MotionMode, TraceOptions } from "@kind-ui/agent-ui/core";
import { onMounted, shallowRef } from "vue";
import { Trace } from "../../../../src/vue/trace.js";
import { expose } from "../../shared/expose.js";
import { manySpans, runningSpans, spans, type TraceLog } from "../../shared/trace.js";
import { useFlush } from "./flush.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const log: TraceLog = { values: [], expanded: [] };

const many = props.variant.startsWith("many-") ? manySpans(Number(props.variant.slice(5))) : undefined;
const running = props.variant === "running";
const refuse = props.variant === "refused";
const motion: MotionMode | undefined = props.variant === "reduced" ? "reduced" : undefined;

const now = shallowRef(4000);
const value = shallowRef<string | null>(null);
const expanded = shallowRef(many?.expanded ?? []);
const flush = useFlush();

type Change<Key extends "onValueChange" | "onExpandedChange"> = Parameters<NonNullable<TraceOptions[Key]>>;

function valueChange(...[next, details]: Change<"onValueChange">) {
  log.values.push(`${next} ${details.reason}`);
  if (refuse) details.cancel();
}

function expandedChange(...[next, details]: Change<"onExpandedChange">) {
  log.expanded.push(`${next.join(",")} ${details.reason}`);
  if (refuse) details.cancel();
}

onMounted(() =>
  expose(
    many
      ? {
          kindTrace: {
            select: (id: string | null) =>
              flush(() => {
                value.value = id;
              }),
            toggle: (id: string) =>
              flush(() => {
                const open = expanded.value;
                expanded.value = open.includes(id) ? open.filter((other) => other !== id) : [...open, id];
              }),
          },
        }
      : {
          kindLog: log,
          kindHost: {
            tick: (ms: number) => {
              now.value = ms;
            },
          },
        },
  ),
);
</script>

<template>
  <!-- A fixed 400px column with a 600px viewport and 28px rows, so the same rows are in view at 50 spans as at 5,000. -->
  <div v-if="many" class="w-[400px]" style="--kind-trace-height: 600px">
    <Trace
      :spans="many.spans"
      :value="value"
      :expanded="expanded"
      motion="none"
      @value-change="(next: string | null) => (value = next)"
      @expanded-change="(next: string[]) => (expanded = next)"
    />
  </div>
  <div v-else class="w-[44rem] max-w-full p-6">
    <Trace
      id="trace"
      label="Agent run"
      :spans="running ? runningSpans : spans"
      :now="running ? now : undefined"
      :motion="motion"
      :default-expanded="['run']"
      @value-change="valueChange"
      @expanded-change="expandedChange"
    />
  </div>
</template>
