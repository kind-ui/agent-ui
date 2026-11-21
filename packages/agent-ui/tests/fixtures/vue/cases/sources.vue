<script lang="ts">
export const variants = ["all", "reduced", "refused"] as const;
</script>

<script setup lang="ts">
import { onMounted, shallowRef } from "vue";
import { Sources } from "../../../../src/vue/sources.js";
import { expose } from "../../shared/expose.js";
import { sources as initial, nextSources } from "../../shared/sources.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const known = (variants as readonly string[]).includes(props.variant);
const motion = props.variant === "reduced" ? "reduced" : undefined;
const refuse = props.variant === "refused";
const openings: string[] = [];
const sources = shallowRef(initial);
const opened = (_open: boolean, details: { reason: string }) => {
  if (refuse) openings.push(details.reason);
};

onMounted(() =>
  expose({
    kindHost: {
      add: () => {
        sources.value = nextSources.add(sources.value);
      },
      rename: () => {
        sources.value = nextSources.rename(sources.value);
      },
      openings,
    },
  }),
);
</script>

<template>
  <p v-if="!known" data-no-case>No case</p>
  <div v-else class="w-[30rem] p-6">
    <Sources
      id="sources"
      :sources="sources"
      :motion="motion"
      :open="refuse ? false : undefined"
      @open-change="opened"
    />
  </div>
</template>
