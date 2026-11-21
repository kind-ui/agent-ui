<script lang="ts">
export const variants = ["default", "reduced", "none", "no-source", "composer", "composer-cancel"] as const;
</script>

<script setup lang="ts">
import { onMounted } from "vue";
import { Composer, ComposerInput, ComposerSubmit } from "../../../../src/vue/composer.js";
import { Dictation } from "../../../../src/vue/dictation.js";
import { dictationHost } from "../../shared/dictation.js";
import { expose } from "../../shared/expose.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const { host, source, record } = dictationHost();

// A host that takes the text over cancels its insertion into the draft.
const takeOver = (text: string, details: { reason: string; source?: string; cancel(): void }) => {
  details.cancel();
  record(text, details);
};
const inComposer = props.variant.startsWith("composer");

onMounted(() => expose({ kindDictation: host }));
</script>

<template>
  <div v-if="inComposer" class="p-4" style="width: 480px">
    <Composer aria-label="Message">
      <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
      <Dictation v-if="variant === 'composer-cancel'" :source="source" @text="takeOver" />
      <Dictation v-else :source="source" />
      <ComposerSubmit />
    </Composer>
  </div>
  <div v-else class="p-6" style="width: 320px">
    <Dictation
      :source="variant === 'no-source' ? undefined : source"
      :motion="variant === 'reduced' ? 'reduced' : variant === 'none' ? 'none' : undefined"
      @text="record"
    />
  </div>
</template>
