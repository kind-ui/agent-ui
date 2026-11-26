<script lang="ts">
  import { Diff } from "@/components/ui/svelte/diff/index.js";

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
</script>

<Diff
  file={{ path: "src/greet.ts", language: "ts" }}
  {before}
  {after}
  onAccept={() => new Promise((resolve) => setTimeout(resolve, 600))}
  onRevert={() => new Promise((resolve) => setTimeout(resolve, 600))}
  class="w-full max-w-xl"
/>
