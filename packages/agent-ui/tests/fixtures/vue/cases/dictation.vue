<script lang="ts">
// `composer` and `composer-cancel` need the Vue Composer.
export const variants = ["default", "reduced", "none", "no-source"] as const;
</script>

<script setup lang="ts">
import { onMounted } from "vue";
import { Dictation } from "../../../../src/vue/dictation.js";
import { dictationHost } from "../../shared/dictation.js";
import { expose } from "../../shared/expose.js";

defineProps<{ variant: string; params: URLSearchParams }>();

const { host, source, record } = dictationHost();

onMounted(() => expose({ kindDictation: host }));
</script>

<template>
  <div class="p-6" style="width: 320px">
    <Dictation
      :source="variant === 'no-source' ? undefined : source"
      :motion="variant === 'reduced' ? 'reduced' : variant === 'none' ? 'none' : undefined"
      @text="record"
    />
  </div>
</template>
