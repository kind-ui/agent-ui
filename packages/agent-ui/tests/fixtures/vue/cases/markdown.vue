<script lang="ts">
export const variants = ["stream", "answer", "unsafe", "table", "highlight", "code-stream"] as const;
</script>

<script setup lang="ts">
import { onMounted, shallowRef } from "vue";
import { CodeBlock } from "../../../../src/vue/code-block.js";
import { Markdown } from "../../../../src/vue/markdown.js";
import { expose } from "../../shared/expose.js";
import {
  answer,
  deferredHighlight,
  longAnswer,
  recordedEngine,
  unsafe,
  wideTable,
} from "../../shared/markdown.js";
import { useFlush } from "./flush.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const frame = "m-4 w-[36rem] text-[var(--kind-color-fg)]";
const flush = useFlush();

const { engine, records } = recordedEngine();
const source = shallowRef("");
const streaming = shallowRef(true);
const { highlight, requests } = deferredHighlight();
const code = shallowRef(props.variant === "highlight" ? "const a = 1;" : "");

onMounted(() => {
  if (props.variant === "stream")
    expose({
      kindMarkdown: {
        source: longAnswer,
        records,
        append: (chunk: string) => flush(() => (source.value += chunk)),
        finish: () => flush(() => (streaming.value = false)),
      },
    });
  if (props.variant === "highlight")
    expose({ kindCode: { requests, setCode: (next: string) => flush(() => (code.value = next)) } });
  if (props.variant === "code-stream")
    expose({ kindCode: { append: (chunk: string) => flush(() => (code.value += chunk)) } });
});
</script>

<template>
  <Markdown v-if="variant === 'stream'" :class="frame" :source="source" :streaming="streaming" :engine="engine" />
  <Markdown v-else-if="variant === 'answer'" :class="frame" :source="answer" />
  <Markdown v-else-if="variant === 'unsafe'" :class="frame" :source="unsafe" />
  <Markdown v-else-if="variant === 'table'" class="m-4 w-80" :source="wideTable" />
  <CodeBlock
    v-else-if="variant === 'highlight'"
    aria-label="Code"
    :class="frame"
    :code="code"
    language="ts"
    :highlight="highlight"
  />
  <CodeBlock v-else aria-label="Code" :class="frame" :code="code" language="ts" streaming line-numbers />
</template>
