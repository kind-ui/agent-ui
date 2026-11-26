import { createSignal, onSettled } from "solid-js";
import { Diff } from "@/components/ui/solid/diff";

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

export default function DiffStreamingExample() {
  const [count, setCount] = createSignal(1);
  onSettled(() => {
    const timer = setInterval(() => setCount((n) => (n > lines.length + 4 ? 1 : n + 1)), 500);
    return () => clearInterval(timer);
  });
  return (
    <Diff
      class="w-full max-w-2xl"
      files={[
        {
          path: "src/lib/auth/session.ts",
          status: "added",
          patch: patchOf(Math.min(count(), lines.length)),
          streaming: count() <= lines.length,
        },
      ]}
    />
  );
}
