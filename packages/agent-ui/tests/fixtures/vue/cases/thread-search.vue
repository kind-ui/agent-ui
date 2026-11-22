<script lang="ts">
export const variants = ["owned", "all", "reduced", "refusing", "sheet", "server"] as const;
</script>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ThreadSearch } from "../../../../src/vue/thread-search.js";
import { expose } from "../../shared/expose.js";
import { NOW, results, threadSearchHost, threads } from "../../shared/thread-search.js";
import { useFlush } from "./flush.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const { host, record } = threadSearchHost();
const motion = props.variant === "reduced" ? "reduced" : undefined;
const presentation = props.variant === "sheet" ? "sheet" : undefined;
const onSelect = record("select", props.variant === "refusing");
const onNew = record("new");
const onQuery = record("query");

/** The host searches: its results in its order, and a status it sets. */
const status = ref<"idle" | "loading" | "error">("loading");
const flush = useFlush();

onMounted(() =>
  expose({
    kindHost:
      props.variant === "server"
        ? { ...host, setStatus: (next: typeof status.value) => flush(() => (status.value = next)) }
        : host,
  }),
);
</script>

<template>
  <div v-if="variant === 'server'" class="p-6">
    <ThreadSearch
      id="search"
      :threads="results"
      :now="NOW"
      :filter="false"
      :status="status"
      @select="onSelect"
      @query-change="onQuery"
    />
  </div>
  <div v-else-if="variant === 'owned'" class="p-6">
    <ThreadSearch id="search" :threads="threads" :now="NOW" query="" @query-change="onQuery" />
  </div>
  <div v-else class="flex flex-col gap-4 p-6">
    <p id="above">Above</p>
    <ThreadSearch
      id="search"
      :threads="threads"
      :now="NOW"
      time-zone="UTC"
      shortcut="mod+k"
      :motion="motion"
      :presentation="presentation"
      @select="onSelect"
      @new="onNew"
      @query-change="onQuery"
    />
  </div>
</template>
