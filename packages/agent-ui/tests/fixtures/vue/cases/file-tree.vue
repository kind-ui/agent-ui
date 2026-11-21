<script lang="ts">
export const variants = ["all", "reduced", "static", "refused"] as const;
</script>

<script setup lang="ts">
import type { FileTreeOptions, MotionMode } from "@kind-ui/agent-ui/core";
import { onMounted, shallowRef } from "vue";
import { FileTree } from "../../../../src/vue/file-tree.js";
import { expose } from "../../shared/expose.js";
import { type FileTreeLog, entries as initial, nextEntries } from "../../shared/file-tree.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const log: FileTreeLog = { selected: [], values: [], expanded: [] };

const motion: MotionMode | undefined = props.variant === "reduced" ? "reduced" : undefined;
const selectable = props.variant !== "static";
const refuse = props.variant === "refused";

const entries = shallowRef(initial);

type Change<Key extends "onValueChange" | "onExpandedChange" | "onSelect"> = Parameters<
  NonNullable<FileTreeOptions[Key]>
>;

function valueChange(...[value, details]: Change<"onValueChange">) {
  log.values.push(`${value} ${details.reason}`);
  if (refuse) details.cancel();
}

function expandedChange(...[expanded, details]: Change<"onExpandedChange">) {
  log.expanded.push(expanded);
  if (refuse) details.cancel();
}

function select(...[path, details]: Change<"onSelect">) {
  log.selected.push(`${path} ${details.reason} ${details.source}`);
}

onMounted(() =>
  expose({
    kindLog: log,
    kindHost: {
      add: () => {
        entries.value = nextEntries.add(entries.value);
      },
      remove: () => {
        entries.value = nextEntries.remove(entries.value);
      },
    },
  }),
);
</script>

<template>
  <div class="w-[22rem] p-6">
    <FileTree
      id="file-tree"
      :entries="entries"
      :motion="motion"
      :default-expanded="['src']"
      @value-change="valueChange"
      @expanded-change="expandedChange"
      v-on="selectable ? { select } : {}"
    />
  </div>
</template>
