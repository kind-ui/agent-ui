<script lang="ts">
export const variants = ["all", "reduced", "refused"] as const;
</script>

<script setup lang="ts">
import type { MotionMode } from "@kind-ui/agent-ui/core";
import { onMounted } from "vue";
import { InlineCitation } from "../../../../src/vue/inline-citation.js";
import { expose } from "../../shared/expose.js";
import { lateSource, sources } from "../../shared/sources.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const motion: MotionMode | undefined = props.variant === "reduced" ? "reduced" : undefined;
const refuse = props.variant === "refused";
const openings: string[] = [];

onMounted(() => expose({ kindHost: { openings } }));
</script>

<template>
  <div class="w-[40rem] p-6 text-sm leading-6">
    <p id="prose">
      Back off when you hit a limit <InlineCitation id="many" :sources="sources" :motion="motion" /> and read
      the header
      <InlineCitation
        id="one"
        :sources="[lateSource]"
        label="1"
        :motion="motion"
        v-bind="refuse ? { open: false } : {}"
        @open-change="(_open: boolean, details: { reason: string }) => refuse && openings.push(details.reason)"
      />.
    </p>
  </div>
</template>
