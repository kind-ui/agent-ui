<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { Diff } from "@/components/ui/vue/diff";

const lines = [
  'import { randomUUID } from "node:crypto";',
  "",
  "export async function create(userId: string) {",
  "  const id = randomUUID();",
  "  await db.sessions.insert({ id, userId });",
  "  return id;",
  "}",
];

const patchOf = (count: number) =>
  `--- /dev/null\n+++ b/src/lib/auth/session.ts\n@@ -0,0 +1,${count} @@\n${lines
    .slice(0, count)
    .map((line) => `+${line}`)
    .join("\n")}\n`;

const count = ref(1);
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  timer = setInterval(() => {
    count.value = count.value > lines.length + 4 ? 1 : count.value + 1;
  }, 500);
});
onBeforeUnmount(() => clearInterval(timer));

const files = computed(() => [
  {
    path: "src/lib/auth/session.ts",
    status: "added" as const,
    patch: patchOf(Math.min(count.value, lines.length)),
    streaming: count.value <= lines.length,
  },
]);
</script>

<template>
  <Diff class="w-full max-w-2xl" :files="files" />
</template>
