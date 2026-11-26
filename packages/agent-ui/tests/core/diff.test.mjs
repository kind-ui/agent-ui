import assert from "node:assert/strict";
import { test } from "node:test";
import { diffCounts, diffCountsName, diffRows } from "@kind-ui/agent-ui/core";

const words = (row) => row.words?.map((word) => (word.changed ? `[${word.text}]` : word.text)).join("");

test("a patch's headers say what happened to the file", () => {
  const renamed = diffRows({
    patch: "diff --git a/old/a.ts b/new/a.ts\nsimilarity index 90%\nrename from old/a.ts\nrename to new/a.ts\n",
  });
  assert.deepEqual(renamed.file, { path: "new/a.ts", oldPath: "old/a.ts", status: "renamed" });
  assert.equal(renamed.hunks.length, 0);
  const binary = diffRows({ patch: "diff --git a/b.png b/b.png\nBinary files a/b.png and b/b.png differ\n" });
  assert.equal(binary.binary, true);
  const added = diffRows({ patch: "--- /dev/null\n+++ b/c.ts\n@@ -0,0 +1,2 @@\n+a\n+b\n" });
  assert.deepEqual(added.file, { path: "c.ts", status: "added" });
  assert.equal(added.added, 2);
});

test("a streamed patch shows the lines of its last change so far, and keeps the rows it parsed", () => {
  const head = "--- a/a.ts\n+++ b/a.ts\n@@ -1,3 +1,4 @@\n a\n-b\n+B\n";
  const first = diffRows({ patch: head });
  assert.deepEqual(
    first.hunks[0].rows.map((row) => row.kind),
    ["context", "remove", "add"],
  );
  const next = diffRows({ patch: `${head}+c\n` }, first);
  assert.equal(next.hunks[0].rows[0], first.hunks[0].rows[0]);
  assert.equal(next.added, 2);
});

test("changed words pair by similarity, and a line rewritten past the limit isn't marked", () => {
  const { hunks } = diffRows({
    patch: "@@ -1,3 +1,3 @@\n-const ok = compare(a, b);\n-return x;\n+let y = 1;\n+const ok = await compare(a, b);\n",
  });
  const rows = hunks[0].rows;
  assert.equal(words(rows[0]), "const ok = compare(a, b);");
  assert.equal(words(rows[3]), "const ok = [await ]compare(a, b);");
  assert.equal(rows[1].words, undefined);
  assert.equal(rows[2].words, undefined);
});

test("unchanged runs fold to 3 lines on each side of a change", () => {
  const before = `${Array.from({ length: 30 }, (_, i) => `line ${i + 1}`).join("\n")}\n`;
  const after = before.replace("line 2\n", "line two\n").replace("line 25\n", "line twenty-five\n");
  const { hunks, end } = diffRows({ before, after });
  assert.equal(hunks.length, 2);
  assert.deepEqual(
    hunks[1].gap.map((row) => [row.kind, row.lines?.length]),
    [["collapsed", 16]],
  );
  assert.deepEqual(
    end.map((row) => row.kind),
    ["context", "context"],
  );
});

test("counts leave out the zero side and use a real minus sign", () => {
  assert.equal(diffCounts(120, 8), "+120 \u22128");
  assert.equal(diffCounts(38, 0), "+38");
  assert.equal(diffCountsName(1, 3), "1 addition, 3 deletions");
});
