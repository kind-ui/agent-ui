<script setup lang="ts">
import { Diff } from "@/components/ui/vue/diff";

const before = `export function greet(name: string) {
  return "Hello, " + name;
}

export function farewell(name: string) {
  return "Goodbye, " + name;
}
`;

const after = `export function greet(name: string, punctuation = "!") {
  return \`Hello, \${name}\${punctuation}\`;
}

export function farewell(name: string) {
  return "Goodbye, " + name;
}
`;

const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 600));
</script>

<template>
  <Diff
    :file="{ path: 'src/greet.ts', language: 'ts' }"
    :before="before"
    :after="after"
    :on-accept="settle"
    :on-revert="settle"
    class="w-full max-w-xl"
  />
</template>
