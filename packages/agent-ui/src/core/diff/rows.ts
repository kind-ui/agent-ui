import { diffWordsWithSpace, parsePatch, type StructuredPatchHunk, structuredPatch } from "diff";
import type { DiffFile } from "../../types/index.js";
import type { Token } from "../code-block/code-block.js";

/** A piece of a changed line: `changed` marks text its paired line doesn't have. */
export interface DiffWord {
  text: string;
  changed: boolean;
}

/** A row of a diff: a hunk's `@@` header, a line, or a run of unchanged lines folded away. */
export interface DiffRow {
  /** Stays the same while the row's hunk is kept, so a row keeps its element as a patch streams. */
  key: string;
  kind: "hunk" | "context" | "add" | "remove" | "collapsed";
  oldLine?: number;
  newLine?: number;
  /** The line without its sign, or a hunk's header. Empty for a collapsed run. */
  text: string;
  /** The line split where it differs from the line it pairs with. */
  words?: readonly DiffWord[];
  /** A collapsed run's unchanged lines. */
  lines?: readonly DiffRow[];
}

/** The rows of one hunk, and where it starts in the patch. */
export interface DiffHunk {
  offset: number;
  rows: readonly DiffRow[];
  added: number;
  removed: number;
}

export interface DiffRowsInput {
  patch?: string | undefined;
  before?: string | undefined;
  after?: string | undefined;
}

export interface DiffRows {
  input: DiffRowsInput;
  /** What a patch's headers say about the file. */
  file: Partial<DiffFile>;
  hunks: readonly DiffHunk[];
  rows: readonly DiffRow[];
  added: number;
  removed: number;
}

const CONTEXT = 3;

const sameWords = (a: readonly DiffWord[] | undefined, b: readonly DiffWord[] | undefined) =>
  a === b ||
  (a !== undefined &&
    b !== undefined &&
    a.length === b.length &&
    a.every((word, i) => word.text === b[i]?.text && word.changed === b[i]?.changed));

const sameRow = (a: DiffRow, b: DiffRow): boolean =>
  a.key === b.key &&
  a.kind === b.kind &&
  a.oldLine === b.oldLine &&
  a.newLine === b.newLine &&
  a.text === b.text &&
  sameWords(a.words, b.words) &&
  (a.lines?.length ?? 0) === (b.lines?.length ?? 0);

function pairWords(removed: DiffRow[], added: DiffRow[]) {
  for (let i = 0; i < Math.min(removed.length, added.length); i++) {
    const before = removed[i] as DiffRow;
    const after = added[i] as DiffRow;
    const changes = diffWordsWithSpace(before.text, after.text);
    before.words = changes
      .filter((change) => !change.added)
      .map((change) => ({ text: change.value, changed: change.removed }));
    after.words = changes
      .filter((change) => !change.removed)
      .map((change) => ({ text: change.value, changed: change.added }));
  }
}

const collapse = (key: string, lines: DiffRow[]): DiffRow => ({
  key,
  kind: "collapsed",
  ...(lines[0]?.oldLine !== undefined && { oldLine: lines[0].oldLine }),
  ...(lines[0]?.newLine !== undefined && { newLine: lines[0].newLine }),
  text: "",
  lines,
});

/** A run of unchanged lines between changes keeps 3 lines of context on each side and folds the rest away. */
function foldRuns(rows: DiffRow[]): DiffRow[] {
  const folded: DiffRow[] = [];
  let run: DiffRow[] = [];
  const flush = (between: boolean) => {
    if (between && run.length > CONTEXT * 2) {
      folded.push(...run.slice(0, CONTEXT));
      folded.push(collapse(`${run[CONTEXT]?.key}c`, run.slice(CONTEXT, -CONTEXT)));
      folded.push(...run.slice(-CONTEXT));
    } else folded.push(...run);
    run = [];
  };
  for (const row of rows) {
    if (row.kind === "context") {
      run.push(row);
      continue;
    }
    flush(folded.length > 0);
    folded.push(row);
  }
  flush(false);
  return folded;
}

function hunkRows(hunk: StructuredPatchHunk, index: number, header: boolean): Omit<DiffHunk, "offset"> {
  const rows: DiffRow[] = [];
  let oldLine = hunk.oldStart;
  let newLine = hunk.newStart;
  let removed: DiffRow[] = [];
  let added: DiffRow[] = [];
  let addedCount = 0;
  let removedCount = 0;
  const pair = () => {
    pairWords(removed, added);
    removed = [];
    added = [];
  };
  hunk.lines.forEach((line, i) => {
    const sign = line[0];
    const key = `${index}.${i}`;
    const text = line.slice(1);
    if (sign === "-") {
      if (added.length > 0) pair();
      const row: DiffRow = { key, kind: "remove", oldLine: oldLine++, text };
      removed.push(row);
      rows.push(row);
      removedCount++;
    } else if (sign === "+") {
      const row: DiffRow = { key, kind: "add", newLine: newLine++, text };
      added.push(row);
      rows.push(row);
      addedCount++;
    } else if (sign !== "\\") {
      pair();
      rows.push({ key, kind: "context", oldLine: oldLine++, newLine: newLine++, text });
    }
  });
  pair();
  const folded = foldRuns(rows);
  if (header) {
    const range = (start: number, count: number) => `${count === 0 ? start - 1 : start},${count}`;
    folded.unshift({
      key: `${index}.h`,
      kind: "hunk",
      text: `@@ -${range(hunk.oldStart, hunk.oldLines)} +${range(hunk.newStart, hunk.newLines)} @@`,
    });
  }
  return { rows: folded, added: addedCount, removed: removedCount };
}

const HUNK_HEADER = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@(.*)$/;

/** Parses one hunk's text. A hunk still streaming in is short of the lines its header counts, so they're counted. */
function parseHunk(text: string): StructuredPatchHunk | undefined {
  try {
    return parsePatch(text)[0]?.hunks[0];
  } catch {
    const lines = text.split("\n");
    if (lines.at(-1) === "") lines.pop();
    const match = HUNK_HEADER.exec(lines[0] ?? "");
    if (!match) return undefined;
    const body = lines.slice(1);
    const count = (skip: string) => body.filter((line) => line[0] !== skip && line[0] !== "\\").length;
    const header = `@@ -${match[1]},${count("+")} +${match[2]},${count("-")} @@${match[3]}`;
    try {
      return parsePatch([header, ...body].join("\n"))[0]?.hunks[0];
    } catch {
      return undefined;
    }
  }
}

const withoutPrefix = (name: string | undefined) =>
  name === undefined || name === "/dev/null" ? undefined : name.replace(/^[ab]\//, "");

function fileOf(head: string): Partial<DiffFile> {
  let index: ReturnType<typeof parsePatch>[number] | undefined;
  try {
    index = parsePatch(head)[0];
  } catch {
    return {};
  }
  const oldPath = withoutPrefix(index?.oldFileName);
  const path = withoutPrefix(index?.newFileName);
  if (index?.oldFileName === "/dev/null" && path) return { path, status: "added" };
  if (index?.newFileName === "/dev/null" && oldPath) return { path: oldPath, status: "deleted" };
  if (oldPath && path && (index?.isRename || oldPath !== path)) return { path, oldPath, status: "renamed" };
  return path ? { path, status: "modified" } : {};
}

const hunkOffsets = (patch: string) => {
  const offsets: number[] = [];
  const pattern = /^@@ /gm;
  for (let match = pattern.exec(patch); match; match = pattern.exec(patch)) offsets.push(match.index);
  return offsets;
};

const total = (hunks: readonly DiffHunk[], key: "added" | "removed") =>
  hunks.reduce((sum, hunk) => sum + hunk[key], 0);

function fromPatch(patch: string, previous: DiffRows | undefined): Omit<DiffRows, "input" | "rows"> {
  const offsets = hunkOffsets(patch);
  const before = previous?.input.patch;
  // Every hunk but the last was complete before the patch grew, so only the last is parsed again.
  const kept =
    previous && before !== undefined && patch.startsWith(before) ? previous.hunks.slice(0, -1) : [];
  const hunks: DiffHunk[] = [...kept];
  for (let i = kept.length; i < offsets.length; i++) {
    const offset = offsets[i] as number;
    const parsed = parseHunk(patch.slice(offset, offsets[i + 1]));
    if (!parsed) continue;
    const hunk = { offset, ...hunkRows(parsed, i, true) };
    const last = previous?.hunks[i];
    // A hunk parsed again keeps the rows it already had, so they keep their elements.
    if (last?.offset === offset) {
      hunk.rows = hunk.rows.map((row, r) => {
        const old = last.rows[r];
        return old && sameRow(old, row) ? old : row;
      });
    }
    hunks.push(hunk);
  }
  return {
    file: fileOf(patch.slice(0, offsets[0] ?? patch.length)),
    hunks,
    added: total(hunks, "added"),
    removed: total(hunks, "removed"),
  };
}

/** `before` and `after` with 3 lines of context, and the unchanged lines between hunks folded away. */
function fromFiles(before: string, after: string): Omit<DiffRows, "input" | "rows"> {
  const { hunks: parsed } = structuredPatch("", "", before, after, "", "", { context: CONTEXT });
  const lines = before.split("\n");
  if (lines.at(-1) === "") lines.pop();
  const hunks: DiffHunk[] = [];
  let next = 0;
  let shift = 0;
  const gap = (to: number, key: string, edge: boolean): DiffRow[] => {
    const rows = lines.slice(next, to).map(
      (text, i): DiffRow => ({
        key: `${key}.${i}`,
        kind: "context",
        oldLine: next + i + 1,
        newLine: next + i + 1 + shift,
        text,
      }),
    );
    // A run at either end of the file has context on one side only, so it folds once it's longer than that.
    if (rows.length === 0 || (edge && rows.length <= CONTEXT)) return rows;
    return [collapse(key, rows)];
  };
  parsed.forEach((hunk, i) => {
    const start = hunk.oldStart - 1;
    const { rows, added, removed } = hunkRows(hunk, i, false);
    hunks.push({ offset: 0, rows: [...gap(start, `g${i}`, i === 0), ...rows], added, removed });
    next = start + hunk.oldLines;
    shift += hunk.newLines - hunk.oldLines;
  });
  const last = hunks.at(-1);
  if (last) last.rows = [...last.rows, ...gap(lines.length, "end", true)];
  return { file: {}, hunks, added: total(hunks, "added"), removed: total(hunks, "removed") };
}

/**
 * The rows of a one-file diff, from a unified `patch` or from `before` and `after`. Pass the last result as
 * `previous`: the same input returns it, and a patch that continues it parses only from its last hunk.
 */
export function diffRows(input: DiffRowsInput, previous?: DiffRows): DiffRows {
  if (
    previous &&
    previous.input.patch === input.patch &&
    previous.input.before === input.before &&
    previous.input.after === input.after
  ) {
    return previous;
  }
  const diff =
    input.patch !== undefined
      ? fromPatch(input.patch, previous)
      : fromFiles(input.before ?? "", input.after ?? "");
  return { input, ...diff, rows: diff.hunks.flatMap((hunk) => hunk.rows) };
}

/** A run of a line to render: its text, its color from the highlighter, and whether it's a changed word. */
export interface DiffPiece {
  text: string;
  color?: string;
  fontStyle?: "italic" | "bold";
  changed: boolean;
}

/** Splits a line's highlighter tokens at its changed words, so both show. Without tokens the line is plain. */
export function diffPieces(
  text: string,
  tokens: readonly Token[] | undefined,
  words: readonly DiffWord[] | undefined,
): DiffPiece[] {
  const runs = tokens?.length ? tokens : [{ content: text }];
  const marks = words?.length ? words : [{ text, changed: false }];
  const pieces: DiffPiece[] = [];
  let t = 0;
  let w = 0;
  let inToken = 0;
  let inWord = 0;
  while (t < runs.length && w < marks.length) {
    const token = runs[t] as Token;
    const word = marks[w] as DiffWord;
    const length = Math.min(token.content.length - inToken, word.text.length - inWord);
    if (length > 0) {
      pieces.push({
        text: token.content.slice(inToken, inToken + length),
        ...(token.color && { color: token.color }),
        ...(token.fontStyle && { fontStyle: token.fontStyle }),
        changed: word.changed,
      });
    }
    inToken += length;
    inWord += length;
    if (inToken >= token.content.length) {
      t++;
      inToken = 0;
    }
    if (inWord >= word.text.length) {
      w++;
      inWord = 0;
    }
  }
  return pieces;
}

/** Splits highlighter tokens into lines. */
export function tokenLines(tokens: readonly Token[]): Token[][] {
  const lines: Token[][] = [[]];
  for (const token of tokens) {
    token.content.split("\n").forEach((content, index) => {
      if (index > 0) lines.push([]);
      if (content) lines[lines.length - 1]?.push({ ...token, content });
    });
  }
  return lines;
}
