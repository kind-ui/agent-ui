"use client";

import { Diff } from "@/components/ui/diff";

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

export default function DiffExample() {
  return (
    <Diff
      file={{ path: "src/greet.ts", language: "ts" }}
      before={before}
      after={after}
      onAccept={() => new Promise((resolve) => setTimeout(resolve, 600))}
      onRevert={() => new Promise((resolve) => setTimeout(resolve, 600))}
      className="w-full max-w-xl"
    />
  );
}
