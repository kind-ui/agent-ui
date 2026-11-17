import type { FileTreeEntry } from "@kind-ui/agent-ui";

export const entries: FileTreeEntry[] = [
  { path: "src/index.ts", change: "modified", additions: 12, deletions: 3 },
  { path: "src/lib/format.ts", change: "added", additions: 40 },
  { path: "src/lib/parse.ts" },
  { path: "src/routes/old.tsx", change: "deleted", deletions: 18 },
  { path: "src/routes/home.tsx", change: "renamed" },
  { path: "docs/" },
  { path: "package.json", change: "modified", additions: 1, deletions: 1 },
  { path: "README.md" },
];

/** The host's entries: `add` adds a file to `src`, `remove` removes `src/index.ts`. */
export const nextEntries = {
  add: (current: FileTreeEntry[]) => [
    ...current,
    { path: "src/cache.ts", change: "added", additions: 7 } as const,
  ],
  remove: (current: FileTreeEntry[]) => current.filter((entry) => entry.path !== "src/index.ts"),
};

/** What the host heard, for the browser spec to read. */
export type FileTreeLog = { selected: string[]; values: string[]; expanded: string[][] };
