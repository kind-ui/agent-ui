<script setup lang="ts">
import type { FileTreeEntry } from "@kind-ui/agent-ui";
import { FileTree } from "@/components/ui/vue/file-tree";

const entries: FileTreeEntry[] = [
  { path: "src/index.ts", change: "modified", additions: 12, deletions: 3 },
  { path: "src/lib/format.ts", change: "added", additions: 40 },
  { path: "src/lib/parse.ts" },
  { path: "src/routes/old.tsx", change: "deleted", deletions: 18 },
  { path: "src/routes/home.tsx", change: "renamed" },
  { path: "package.json", change: "modified", additions: 1, deletions: 1 },
  { path: "README.md" },
];
</script>

<template>
  <FileTree :entries="entries" :default-expanded="['src', 'src/lib']" class="w-full max-w-sm" />
</template>
