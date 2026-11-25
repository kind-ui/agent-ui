import { createTwoFilesPatch } from "diff";

const lines = (count: number, line: (i: number) => string) =>
  `${Array.from({ length: count }, (_, i) => line(i + 1)).join("\n")}\n`;

const original = Array.from({ length: 30 }, (_, i) => `export const value${i + 1} = ${i + 1};`);

/** 30 lines: two lines replaced around a 20-line unchanged run, one removed and ten added: +12 −3. */
export const before = `${original.join("\n")}\n`;

export const after = `${[
  ...original.slice(0, 2),
  "export const value3 = three;",
  ...original.slice(3, 23),
  "export const value24 = twentyFour;",
  ...original.slice(24, 26),
  ...original.slice(27),
  ...Array.from({ length: 10 }, (_, i) => `export const extra${i + 1} = ${i + 1};`),
].join("\n")}\n`;

export const renamePatch = `diff --git a/src/old-name.ts b/src/new-name.ts
similarity index 80%
rename from src/old-name.ts
rename to src/new-name.ts
--- a/src/old-name.ts
+++ b/src/new-name.ts
@@ -1,3 +1,3 @@
 import { a } from "./a.js";
-export const name = "old";
+export const name = "new";
 export default a;
`;

/** A patch of `count` changed lines in one hunk, every other line replaced. */
export const longPatch = (count: number) =>
  createTwoFilesPatch(
    "src/long.ts",
    "src/long.ts",
    lines(count, (i) => `line ${i}`),
    lines(count, (i) => (i % 2 ? `line ${i}` : `line ${i} changed`)),
    "",
    "",
    { context: 3 },
  );

/** One more hunk, appended to a `longPatch` as a stream would. */
export const nextHunk = (count: number) =>
  `@@ -${count + 10},2 +${count + 10},3 @@\n line a\n+line b\n line c\n`;
