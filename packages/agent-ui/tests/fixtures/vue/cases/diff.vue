<script lang="ts">
export const variants = ["all", "live", "single", "stream", "budget"] as const;
</script>

<script setup lang="ts">
import type { DiffFile } from "@kind-ui/agent-ui";
import { computed, onMounted, shallowRef } from "vue";
import { Diff } from "../../../../src/vue/diff.js";
import { bigPatch, createDiffHost, files, frames, run, streamedSession } from "../../shared/diff.js";
import { expose } from "../../shared/expose.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const noop = () => new Promise<void>(() => {});

const live: Record<string, { initial: DiffFile[]; open?: string[] }> = {
  live: { initial: run, open: [files.signIn.path] },
  single: { initial: [files.packageJson] },
  stream: { initial: [files.signIn, streamedSession(4)], open: [files.session.path] },
};

const setup = live[props.variant];
const list = shallowRef<DiffFile[]>(setup?.initial ?? []);
const host = createDiffHost(
  () => list.value,
  (next) => {
    list.value = next;
  },
);

const count = Number(props.params.get("lines") ?? 10);
const extra = shallowRef(0);
const big = computed(() => bigPatch(count, extra.value));

onMounted(() => {
  if (setup) expose({ kindDiff: host.handle });
  if (props.variant === "budget")
    expose({
      kindDiffStream: () => {
        extra.value += 1;
      },
    });
});
</script>

<template>
  <div v-if="props.variant === 'all'" class="flex w-[48rem] max-w-full flex-col gap-6 p-6">
    <Diff
      v-for="frame in frames"
      :id="frame.id"
      :key="frame.id"
      :files="frame.files"
      :default-open="frame.open"
      :on-keep="noop"
      :on-undo="noop"
    />
  </div>
  <div v-else-if="setup" class="flex w-[48rem] max-w-full flex-col gap-4 p-6">
    <button type="button">Before</button>
    <Diff
      id="live"
      :files="list"
      :default-open="setup.open"
      :on-keep="host.onKeep"
      :on-undo="host.onUndo"
      @open-change="host.onOpenChange"
    />
    <button type="button">After</button>
  </div>
  <div v-else-if="props.variant === 'budget'" class="w-[48rem] p-6">
    <Diff id="budget" :files="[big]" />
  </div>
  <p v-else data-no-case>No case</p>
</template>
