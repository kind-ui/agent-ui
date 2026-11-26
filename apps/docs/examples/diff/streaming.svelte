<script lang="ts">
  import { Diff } from "@/components/ui/svelte/diff/index.js";

  const lines = [
    "export async function create(userId: string) {",
    "  const id = crypto.randomUUID();",
    "  await db.sessions.insert({ id, userId });",
    "  return id;",
    "}",
  ];

  const patchOf = (count: number) =>
    `--- /dev/null\n+++ b/src/lib/auth/session.ts\n@@ -0,0 +1,${count} @@\n${lines
      .slice(0, count)
      .map((line) => `+${line}`)
      .join("\n")}\n`;

  let count = $state(1);

  $effect(() => {
    const timer = setInterval(() => (count = count > lines.length + 4 ? 1 : count + 1), 500);
    return () => clearInterval(timer);
  });

  const streaming = $derived(count <= lines.length);
</script>

<Diff
  class="w-full max-w-2xl"
  files={[
    {
      path: "src/lib/auth/session.ts",
      status: "added",
      patch: patchOf(Math.min(count, lines.length)),
      streaming,
    },
  ]}
/>
