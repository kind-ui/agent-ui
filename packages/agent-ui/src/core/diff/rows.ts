import { diffWordsWithSpace, parsePatch, type StructuredPatchHunk, structuredPatch } from "diff";
import type { DiffFile } from "../../types/index.js";
import type { Token } from "../code-block/code-block.js";

/** A piece of a changed line: `changed` marks text its paired line doesn't have. */
export interface DiffWord {
  text: string;
  changed: boolean;
}

/** A row of a file's diff: a line, or a run of unchanged lines folded away. */
export interface DiffRow {
  /** Stays the same while the row's change is kept, so a row keeps its element as a patch streams. */
  key: string;
  kind: "context" | "add" | "remove" | "collapsed";
  /** The change (hunk) the row belongs to. Unchanged lines between changes belong to none. */
  change?: number;
  oldLine?: number;
  newLine?: number;
  /** The line without its sign. Empty for a collapsed run. */
  text: string;
  /** The line split where it differs from the line it pairs with. */
  words?: readonly DiffWord[];
  /** A collapsed run's unchanged lines. */
  lines?: readonly DiffRow[];
}

/** One change (hunk): its rows, where it starts, and what it adds and removes. */
export interface DiffHunk {
  offset: number;
  /** The line it starts at in the new file, or in the old one when it only removes. */
  line: number;
  /** The unchanged lines before it, folded away, which belong to no change. */
  gap: readonly DiffRow[];
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
  /** A patch's `Binary files … differ`, or a file given no text at all. */
  binary: boolean;
  hunks: readonly DiffHunk[];
  /** Unchanged lines after the last change, folded away. */
  end: readonly DiffRow[];
  added: number;
  removed: number;
}

/** Lines of unchanged context kept on each side of a change. */
const CONTEXT = 3;
/** Past this share of the longer line changed, word marks stop helping: about 25% edit distance over both lines. */
const PAIR_DISTANCE = 0.5;
/** Blocks of changed lines larger than this aren't paired, so pairing stays cheap. */
const PAIR_LIMIT = 40;

const sameWords = (a: readonly DiffWord[] | undefined, b: readonly DiffWord[] | undefined) =>
  a === b ||
  (a !== undefined &&
    b !== undefined &&
    a.length === b.length &&
    a.every((word, i) => word.text === b[i]?.text && word.changed === b[i]?.changed));

const sameRow = (a: DiffRow, b: DiffRow): boolean =>
  a.key === b.key &&
  a.kind === b.kind &&
  a.change === b.change &&
  a.oldLine === b.oldLine &&
  a.newLine === b.newLine &&
  a.text === b.text &&
  sameWords(a.words, b.words) &&
  (a.lines?.length ?? 0) === (b.lines?.length ?? 0);

/** Joins marks that one unchanged character splits, so a line reads as a few marks rather than many. */
function mergeMarks(words: DiffWord[]): DiffWord[] {
  const merged: DiffWord[] = [];
  for (let i = 0; i < words.length; i++) {
    const word = words[i] as DiffWord;
    const last = merged.at(-1);
    const next = words[i + 1];
    if (!word.changed && word.text.length === 1 && last?.changed && next?.changed) {
      last.text += word.text + next.text;
      i++;
    } else if (last && last.changed === word.changed) last.text += word.text;
    else merged.push({ ...word });
  }
  return merged;
}

/** The two lines' words, or `undefined` when they differ too much to mark. */
function wordsOf(before: string, after: string) {
  const changes = diffWordsWithSpace(before, after);
  let removed = 0;
  let added = 0;
  for (const change of changes) {
    if (change.removed) removed += change.value.length;
    if (change.added) added += change.value.length;
  }
  const longest = Math.max(before.length, after.length);
  if (longest === 0 || Math.max(removed, added) / longest > PAIR_DISTANCE) return undefined;
  const side = (skip: "added" | "removed", mark: "added" | "removed") =>
    mergeMarks(
      changes
        .filter((change) => !change[skip])
        .map((change) => ({ text: change.value, changed: change[mark] })),
    );
  return { before: side("added", "removed"), after: side("removed", "added"), changed: removed + added };
}

/**
 * Marks changed words on removed and added lines that read as edits of each other: each removed line pairs with
 * the most similar added line after the last pair, not the one at its position, and a pair past the distance is
 * skipped.
 */
function pairWords(removed: DiffRow[], added: DiffRow[]) {
  if (removed.length > PAIR_LIMIT || added.length > PAIR_LIMIT) return;
  let from = 0;
  for (const before of removed) {
    let best: { index: number; words: NonNullable<ReturnType<typeof wordsOf>> } | undefined;
    for (let j = from; j < added.length; j++) {
      const words = wordsOf(before.text, (added[j] as DiffRow).text);
      if (words && (!best || words.changed < best.words.changed)) best = { index: j, words };
    }
    if (!best) continue;
    before.words = best.words.before;
    (added[best.index] as DiffRow).words = best.words.after;
    from = best.index + 1;
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

/** A run of more than 6 unchanged lines between changed ones keeps 3 on each side and folds the rest away. */
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

const startLine = (hunk: StructuredPatchHunk) => (hunk.newLines === 0 ? hunk.oldStart : hunk.newStart);

function hunkRows(hunk: StructuredPatchHunk, index: number): Omit<DiffHunk, "offset" | "gap"> {
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
      const row: DiffRow = { key, kind: "remove", change: index, oldLine: oldLine++, text };
      removed.push(row);
      rows.push(row);
      removedCount++;
    } else if (sign === "+") {
      const row: DiffRow = { key, kind: "add", change: index, newLine: newLine++, text };
      added.push(row);
      rows.push(row);
      addedCount++;
    } else if (sign !== "\\") {
      pair();
      rows.push({ key, kind: "context", change: index, oldLine: oldLine++, newLine: newLine++, text });
    }
  });
  pair();
  return { line: startLine(hunk), rows: foldRuns(rows), added: addedCount, removed: removedCount };
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

function fileOf(head: string): { file: Partial<DiffFile>; binary: boolean } {
  let index: ReturnType<typeof parsePatch>[number] | undefined;
  try {
    index = parsePatch(head)[0];
  } catch {
    return { file: {}, binary: false };
  }
  const binary = index?.isBinary === true || /^GIT binary patch$/m.test(head);
  const oldPath = withoutPrefix(index?.oldFileName);
  const path = withoutPrefix(index?.newFileName);
  let file: Partial<DiffFile> = {};
  if (index?.oldFileName === "/dev/null" && path) file = { path, status: "added" };
  else if (index?.newFileName === "/dev/null" && oldPath) file = { path: oldPath, status: "deleted" };
  else if (oldPath && path && (index?.isRename || oldPath !== path)) file = { path, oldPath, status: "renamed" };
  else if (path) file = { path, status: "modified" };
  return { file, binary };
}

const hunkOffsets = (patch: string) => {
  const offsets: number[] = [];
  const pattern = /^@@ /gm;
  for (let match = pattern.exec(patch); match; match = pattern.exec(patch)) offsets.push(match.index);
  return offsets;
};

const total = (hunks: readonly DiffHunk[], key: "added" | "removed") =>
  hunks.reduce((sum, hunk) => sum + hunk[key], 0);

function fromPatch(patch: string, previous: DiffRows | undefined): Omit<DiffRows, "input"> {
  const offsets = hunkOffsets(patch);
  const before = previous?.input.patch;
  // Every hunk but the last was complete before the patch grew, so only the last is parsed again.
  const kept = previous && before !== undefined && patch.startsWith(before) ? previous.hunks.slice(0, -1) : [];
  const hunks: DiffHunk[] = [...kept];
  for (let i = kept.length; i < offsets.length; i++) {
    const offset = offsets[i] as number;
    const parsed = parseHunk(patch.slice(offset, offsets[i + 1]));
    if (!parsed) continue;
    const hunk: DiffHunk = { offset, gap: [], ...hunkRows(parsed, i) };
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
    ...fileOf(patch.slice(0, offsets[0] ?? patch.length)),
    hunks,
    end: [],
    added: total(hunks, "added"),
    removed: total(hunks, "removed"),
  };
}

/** `before` and `after` with 3 lines of context, and the unchanged lines around changes folded away. */
function fromFiles(before: string, after: string): Omit<DiffRows, "input"> {
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
    hunks.push({ offset: 0, gap: gap(start, `g${i}`, i === 0), ...hunkRows(hunk, i) });
    next = start + hunk.oldLines;
    shift += hunk.newLines - hunk.oldLines;
  });
  const end = hunks.length > 0 ? gap(lines.length, "end", true) : [];
  return { file: {}, binary: false, hunks, end, added: total(hunks, "added"), removed: total(hunks, "removed") };
}

/**
 * The changes of one file, from a unified `patch` or from `before` and `after`. Pass the last result as
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
  if (input.patch !== undefined) return { input, ...fromPatch(input.patch, previous) };
  if (input.before === undefined && input.after === undefined) {
    return { input, file: {}, binary: true, hunks: [], end: [], added: 0, removed: 0 };
  }
  return { input, ...fromFiles(input.before ?? "", input.after ?? "") };
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
