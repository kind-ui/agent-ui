"use client";

import { useEffect, useState } from "react";
import { Diff } from "@/components/ui/diff";

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

export default function DiffStreamingExample() {
  const [count, setCount] = useState(1);
  useEffect(() => {
    const timer = setInterval(() => setCount((n) => (n > lines.length + 4 ? 1 : n + 1)), 500);
    return () => clearInterval(timer);
  }, []);
  const streaming = count <= lines.length;
  return (
    <Diff
      className="w-full max-w-2xl"
      files={[
        {
          path: "src/lib/auth/session.ts",
          status: "added",
          patch: patchOf(Math.min(count, lines.length)),
          streaming,
        },
      ]}
    />
  );
}
