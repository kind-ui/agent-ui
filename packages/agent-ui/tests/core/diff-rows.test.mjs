import assert from "node:assert/strict";
import { test } from "node:test";
import { diffPieces, diffRows } from "@kind-ui/agent-ui/core";

const summary = (rows) =>
  rows.map(
    (row) =>
      `${row.kind[0]}${row.oldLine ?? "_"}:${row.newLine ?? "_"}${row.lines ? `x${row.lines.length}` : ""}`,
  );

const PATCH = `diff --git a/src/a.ts b/src/a.ts
--- a/src/a.ts
+++ b/src/a.ts
@@ -1,3 +1,3 @@
 one
-const a = 1;
+const b = 1;
 three
@@ -10,3 +10,4 @@
 ten
+eleven
 twelve
 thirteen
`;

test("diffRows numbers lines across hunks and counts the change", () => {
  const diff = diffRows({ patch: PATCH });
  assert.deepEqual(summary(diff.rows), [
    "h_:_",
    "c1:1",
    "r2:_",
    "a_:2",
    "c3:3",
    "h_:_",
    "c10:10",
    "a_:11",
    "c11:12",
    "c12:13",
  ]);
  assert.equal(diff.rows[0].text, "@@ -1,3 +1,3 @@");
  assert.equal(diff.added, 2);
  assert.equal(diff.removed, 1);
  assert.deepEqual(diff.file, { path: "src/a.ts", status: "modified" });
});

test("diffRows marks the words that differ on a paired removed and added line", () => {
  const [, , removed, added] = diffRows({ patch: PATCH }).rows;
  assert.deepEqual(
    removed.words.filter((word) => word.changed).map((word) => word.text),
    ["a"],
  );
  assert.deepEqual(
    added.words.filter((word) => word.changed).map((word) => word.text),
    ["b"],
  );
  assert.deepEqual(
    diffPieces(added.text, [{ content: "const", color: "red" }, { content: " b = 1;" }], added.words),
    [
      { text: "const", color: "red", changed: false },
      { text: " ", changed: false },
      { text: "b", changed: true },
      { text: " = 1;", changed: false },
    ],
  );
});

test("diffRows collapses a 20-line unchanged run between changes, keeping 3 lines each side", () => {
  const lines = Array.from({ length: 22 }, (_, i) => `line ${i + 1}`);
  const before = `${lines.join("\n")}\n`;
  const after = `${["first", ...lines.slice(1, 21), "last"].join("\n")}\n`;
  const rows = diffRows({ before, after }).rows;
  const collapsed = rows.filter((row) => row.kind === "collapsed");
  assert.equal(collapsed.length, 1);
  assert.equal(collapsed[0].lines.length, 14);
  assert.equal(collapsed[0].lines[0].text, "line 5");
  assert.equal(collapsed[0].oldLine, 5);
  const index = rows.indexOf(collapsed[0]);
  assert.deepEqual(
    rows.slice(index - 3, index).map((row) => row.text),
    ["line 2", "line 3", "line 4"],
  );
  assert.deepEqual(
    rows.slice(index + 1, index + 4).map((row) => row.text),
    ["line 19", "line 20", "line 21"],
  );
});

test("diffRows reads a rename and an added file from the patch headers", () => {
  const rename = diffRows({
    patch: "diff --git a/old.ts b/new.ts\nsimilarity index 100%\nrename from old.ts\nrename to new.ts\n",
  });
  assert.deepEqual(rename.file, { path: "new.ts", oldPath: "old.ts", status: "renamed" });
  const added = diffRows({ patch: "--- /dev/null\n+++ b/new.ts\n@@ -0,0 +1,2 @@\n+a\n+b\n" });
  assert.deepEqual(added.file, { path: "new.ts", status: "added" });
  assert.deepEqual(summary(added.rows), ["h_:_", "a_:1", "a_:2"]);
  assert.equal(added.rows[0].text, "@@ -0,0 +1,2 @@");
});

test("a patch that grows parses only its last hunk again, and keeps the rows it had", () => {
  const head = PATCH.slice(0, PATCH.indexOf("@@ -10"));
  const first = diffRows({ patch: `${head}@@ -10,3 +10,4 @@\n ten\n+elev` });
  assert.equal(first.rows.at(-1).text, "elev");
  const second = diffRows({ patch: PATCH }, first);
  assert.equal(second.hunks[0], first.hunks[0]);
  assert.notEqual(second.hunks[1], first.hunks[1]);
  assert.equal(second.hunks[1].rows[1], first.hunks[1].rows[1]);
  assert.equal(second.rows.at(-1).text, "thirteen");
  assert.equal(diffRows({ patch: PATCH }, second), second);
});
