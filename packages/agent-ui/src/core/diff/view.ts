import type { DiffDecision, DiffFile } from "../../types/index.js";
import type { Token } from "../code-block/code-block.js";
import { WORDS } from "../words.js";
import { type DiffPiece, type DiffRow, type DiffRows, diffPieces } from "./rows.js";

/** What a person can do to an edit that's already applied. */
export type DiffAction = "keep" | "undo";

/** A file's row, in the list or as a one-file Diff's header. */
export interface DiffFileView {
  path: string;
  /** The path before a rename, else `undefined`. */
  oldPath: string | undefined;
  status: NonNullable<DiffFile["status"]>;
  /** "Added", "Deleted" or "Renamed"; empty for a modified file. */
  statusText: string;
  added: number;
  removed: number;
  /** "+4 −2", the zero side left out; empty while streaming or without changes. */
  counts: string;
  /** "4 additions, 2 deletions", for the counts. */
  countsName: string;
  streaming: boolean;
  /** "Binary file, not shown", "Renamed, no changes" or "No changes", in place of lines. */
  note: string;
  changeCount: number;
  /** The file's outcome once it, or every one of its changes, is decided. */
  decision: DiffDecision | undefined;
  /** What's being sent for the file, until the host reports a decision. */
  working: DiffAction | undefined;
  /** "Couldn't undo `auth.ts`" after a call for the file failed. */
  error: string;
  /** Whether Keep and Undo show for the file. */
  actionable: boolean;
  /** The widest line number's digits, so the number columns don't move as lines stream. */
  digits: number;
  /** How many rows a cut-off file leaves out, for "Show full diff". 0 when every row shows. */
  hidden: number;
}

/** A change's header: "Change 1 of 2 · line 19", with its own Keep and Undo. */
export interface DiffChangeView {
  path: string;
  index: number;
  title: string;
  decision: DiffDecision | undefined;
  working: DiffAction | undefined;
  error: string;
  actionable: boolean;
}

/** A row of a file's table. */
export interface DiffLineView {
  kind: "change" | DiffRow["kind"];
  /** The row's key in the file's rows, for `expand`. */
  row: string;
  oldLine: number | undefined;
  newLine: number | undefined;
  /** The code, without its sign. */
  text: string;
  pieces: readonly DiffPiece[];
  /** Visually hidden words before the line: "Added:", "Removed:", "Undone, added:"; "blank" for an empty line. */
  prefix: string;
  /** Whether the line's change was undone: it dims in place. */
  undone: boolean;
  /** A collapsed run's "Show 12 lines". */
  show: string;
  /** Where a collapsed run is, in hidden words: ", unchanged lines after change 2". */
  where: string;
  /** A collapsed run's lines, hidden until find in page matches one. */
  hiddenText: string;
}

/** The rows of a file's table, in order. `change` rows are change headers. */
export interface DiffTableRow {
  key: string;
  change: boolean;
}

export interface DiffSummaryView {
  /** "4 files changed", "Editing 2 files" or "All changes reviewed". */
  title: string;
  counts: string;
  countsName: string;
  /** "2 of 4 reviewed" or "3 kept, 1 undone"; empty until something is decided. */
  progress: string;
  allReviewed: boolean;
  /** How many files Keep all and Undo all would act on. */
  undecided: number;
  /** "Undo all 4 files?" */
  question: string;
}

export interface DiffViewInput {
  files: readonly DiffFile[];
  parsed: ReadonlyMap<string, DiffRows>;
  /** The highlighter's tokens for each line of each side, by path and line number. */
  tokens: ReadonlyMap<
    string,
    { old: Readonly<Record<number, Token[]>>; new: Readonly<Record<number, Token[]>> }
  >;
  expanded: ReadonlySet<string>;
  full: ReadonlySet<string>;
  working: Readonly<Record<string, DiffAction>>;
  errors: Readonly<Record<string, string>>;
  perChange: boolean;
  canKeep: boolean;
  canUndo: boolean;
}

export interface DiffView {
  paths: readonly string[];
  files: Record<string, DiffFileView>;
  changes: Record<string, DiffChangeView>;
  lines: Record<string, DiffLineView>;
  tables: Record<string, readonly DiffTableRow[]>;
  summary: DiffSummaryView;
  streaming: boolean;
}

/** Rows a file shows before "Show full diff". */
export const ROW_LIMIT = 2000;

const STATUS_TEXT: Record<DiffFileView["status"], string> = {
  added: "Added",
  modified: "",
  deleted: "Deleted",
  renamed: "Renamed",
};

const MINUS = "\u2212";

const plural = (count: number, one: string, many = `${one}s`) =>
  `${count.toLocaleString("en-US")} ${count === 1 ? one : many}`;

/** "+4 −2", with the zero side left out. */
export const diffCounts = (added: number, removed: number): string =>
  [
    added > 0 && `+${added.toLocaleString("en-US")}`,
    removed > 0 && `${MINUS}${removed.toLocaleString("en-US")}`,
  ]
    .filter(Boolean)
    .join(" ");

/** "4 additions, 2 deletions", with the zero side left out. */
export const diffCountsName = (added: number, removed: number): string =>
  [added > 0 && plural(added, "addition"), removed > 0 && plural(removed, "deletion")]
    .filter(Boolean)
    .join(", ");

/** The last part of a path, as announcements and errors name a file. */
export const fileName = (path: string): string => path.slice(path.lastIndexOf("/") + 1) || path;

/** A file's or a change's target key: the path, or the path and the change's index. */
export const targetKey = (path: string, change?: number): string =>
  change === undefined ? path : `${path}#${change}`;

/** "Kept `auth.ts`", "Undid change 2 of `auth.ts`", "Undid 4 files". */
export const diffAnnouncement = (action: DiffAction, path?: string, change?: number, count = 0): string => {
  const verb = action === "keep" ? WORDS.kept : "Undid";
  if (path === undefined) return `${verb} ${plural(count, "file")}`;
  const name = `\`${fileName(path)}\``;
  return change === undefined ? `${verb} ${name}` : `${verb} change ${change + 1} of ${name}`;
};

/** "Couldn't undo `auth.ts`", "Couldn't keep change 2", "Couldn't undo all changes". */
export const diffError = (action: DiffAction, path?: string, change?: number): string => {
  const verb = `Couldn't ${action}`;
  if (path === undefined) return `${verb} all changes`;
  return change === undefined ? `${verb} \`${fileName(path)}\`` : `${verb} change ${change + 1}`;
};

/** Whether a file is decided: by its own decision, or every change of it. */
export const fileDecision = (file: DiffFile, changeCount: number): DiffDecision | undefined => {
  if (file.decision) return file.decision;
  if (changeCount === 0) return undefined;
  const decisions = Array.from({ length: changeCount }, (_, i) => file.changes?.[i]?.decision);
  if (decisions.some((decision) => decision === undefined)) return undefined;
  // A file with any change kept still holds edits.
  return decisions.includes("kept") ? "kept" : "undone";
};

export const changeDecision = (file: DiffFile, change: number): DiffDecision | undefined =>
  file.decision ?? file.changes?.[change]?.decision;

const noteOf = (file: DiffFile, rows: DiffRows | undefined, status: DiffFileView["status"]) => {
  if (!rows || rows.hunks.length > 0 || file.streaming) return "";
  if (rows.binary) return "Binary file, not shown";
  return status === "renamed" ? "Renamed, no changes" : "No changes";
};

const prefixOf = (row: DiffRow, undone: boolean) => {
  const blank = row.text === "" ? " blank" : "";
  if (row.kind === "add") return `${undone ? "Undone, added" : "Added"}:${blank}`;
  if (row.kind === "remove") return `${undone ? "Undone, removed" : "Removed"}:${blank}`;
  if (undone) return `${WORDS.undone}:${blank}`;
  return blank.trim();
};

// One view per row, kept while its row, tokens and decision hold, so an unchanged row keeps its object.
const lineViews = new WeakMap<
  DiffRow,
  { tokens: Token[] | undefined; undone: boolean; where: string; view: DiffLineView }
>();

const lineView = (
  row: DiffRow,
  tokens: Token[] | undefined,
  undone: boolean,
  where: string,
): DiffLineView => {
  const cached = lineViews.get(row);
  if (cached && cached.tokens === tokens && cached.undone === undone && cached.where === where)
    return cached.view;
  const collapsed = row.kind === "collapsed";
  const count = row.lines?.length ?? 0;
  const view: DiffLineView = {
    kind: row.kind,
    row: row.key,
    oldLine: collapsed || row.kind === "add" ? undefined : row.oldLine,
    newLine: collapsed || row.kind === "remove" ? undefined : row.newLine,
    text: row.text,
    pieces: collapsed ? [] : diffPieces(row.text, tokens, row.words),
    prefix: collapsed ? "" : prefixOf(row, undone),
    undone,
    show: collapsed ? `Show ${plural(count, "line")}` : "",
    where: collapsed ? `, ${where}` : "",
    hiddenText: collapsed ? (row.lines ?? []).map((line) => line.text).join("\n") : "",
  };
  lineViews.set(row, { tokens, undone, where, view });
  return view;
};

const shallowSame = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) return false;
  if (Array.isArray(a)) {
    return Array.isArray(b) && a.length === b.length && a.every((value, i) => shallowSame(value, b[i]));
  }
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => {
      const value = (a as Record<string, unknown>)[key];
      const other = (b as Record<string, unknown>)[key];
      return value === other || (Array.isArray(value) && shallowSame(value, other));
    })
  );
};

/** `next`, with each entry `previous` already had in an equal form kept, and `previous` itself when nothing changed. */
export function keepSame<Value>(
  previous: Record<string, Value>,
  next: Record<string, Value>,
): Record<string, Value> {
  let changed = Object.keys(previous).length !== Object.keys(next).length;
  for (const key of Object.keys(next)) {
    const old = previous[key];
    if (old !== undefined && shallowSame(old, next[key])) next[key] = old;
    else changed = true;
  }
  return changed ? next : previous;
}

/** Everything the parts show, computed from the files and what the component holds. */
export function diffView(input: DiffViewInput): DiffView {
  const { files: list, parsed, tokens, expanded, full, working, errors, perChange } = input;
  const streaming = list.some((file) => file.streaming);
  const files: Record<string, DiffFileView> = {};
  const changes: Record<string, DiffChangeView> = {};
  const lines: Record<string, DiffLineView> = {};
  const tables: Record<string, readonly DiffTableRow[]> = {};
  const paths: string[] = [];
  let added = 0;
  let removed = 0;
  let reviewed = 0;
  let kept = 0;
  let undone = 0;

  for (const file of list) {
    const path = file.path;
    if (Object.hasOwn(files, path)) continue;
    paths.push(path);
    const rows = parsed.get(path);
    const hunks = rows?.hunks ?? [];
    const status = file.status ?? rows?.file.status ?? (file.oldPath ? "renamed" : "modified");
    const oldPath = file.oldPath ?? rows?.file.oldPath;
    const decision = fileDecision(file, hunks.length);
    const fileWorking = working[path];
    const canDecide = !streaming && (input.canKeep || input.canUndo);
    const fileAdded = rows?.added ?? 0;
    const fileRemoved = rows?.removed ?? 0;
    added += fileAdded;
    removed += fileRemoved;
    if (decision) {
      reviewed++;
      if (decision === "kept") kept++;
      else undone++;
    }

    const side = tokens.get(path);
    const table: DiffTableRow[] = [];
    let maxLine = 1;
    const push = (key: string, view: DiffLineView, change = false) => {
      lines[key] = view;
      table.push({ key, change });
      maxLine = Math.max(maxLine, view.oldLine ?? 0, view.newLine ?? 0);
    };
    const addRows = (source: readonly DiffRow[], where: string, isUndone: boolean) => {
      for (const row of source) {
        if (row.kind === "collapsed" && expanded.has(`${path}#${row.key}`)) {
          addRows(row.lines ?? [], where, isUndone);
          continue;
        }
        const rowTokens =
          row.kind === "remove" ? side?.old[row.oldLine ?? 0] : side?.new[row.newLine ?? row.oldLine ?? 0];
        push(`${path}#${row.key}`, lineView(row, rowTokens, isUndone && row.kind !== "collapsed", where));
      }
    };

    hunks.forEach((hunk, index) => {
      addRows(
        hunk.gap,
        index === 0 ? `unchanged lines before change 1` : `unchanged lines after change ${index}`,
        false,
      );
      const changeUndone = changeDecision(file, index) === "undone";
      if (hunks.length > 1) {
        const key = `${path}#h${index}`;
        const changeWorking = working[targetKey(path, index)] ?? fileWorking;
        const changeOwn = file.decision ? undefined : file.changes?.[index]?.decision;
        changes[key] = {
          path,
          index,
          title: `Change ${index + 1} of ${hunks.length} · line ${hunk.line}`,
          decision: changeOwn,
          working: file.decision || changeOwn ? undefined : changeWorking,
          error: errors[targetKey(path, index)] ?? "",
          actionable: canDecide && perChange && !decision && !changeOwn && !changeWorking && !fileWorking,
        };
        push(
          key,
          {
            kind: "change",
            row: `h${index}`,
            oldLine: undefined,
            newLine: undefined,
            text: "",
            pieces: [],
            prefix: "",
            undone: changeUndone,
            show: "",
            where: "",
            hiddenText: "",
          },
          true,
        );
      }
      addRows(hunk.rows, `unchanged lines in change ${index + 1}`, changeUndone);
    });
    addRows(rows?.end ?? [], `unchanged lines after change ${hunks.length}`, false);

    const cut = !full.has(path) && table.length > ROW_LIMIT ? table.length - ROW_LIMIT : 0;
    tables[path] = cut > 0 ? table.slice(0, ROW_LIMIT) : table;
    files[path] = {
      path,
      oldPath: oldPath && oldPath !== path ? oldPath : undefined,
      status,
      statusText: STATUS_TEXT[status],
      added: fileAdded,
      removed: fileRemoved,
      counts: file.streaming ? "" : diffCounts(fileAdded, fileRemoved),
      countsName: file.streaming ? "" : diffCountsName(fileAdded, fileRemoved),
      streaming: file.streaming === true,
      note: noteOf(file, rows, status),
      changeCount: hunks.length,
      decision,
      working: decision ? undefined : fileWorking,
      error: errors[path] ?? "",
      actionable: canDecide && !decision && !fileWorking,
      digits: String(maxLine).length,
      hidden: cut,
    };
  }

  const count = paths.length;
  const allReviewed = count > 0 && reviewed === count && !streaming;
  const undecided = count - reviewed;
  return {
    paths,
    files,
    changes,
    lines,
    tables,
    streaming,
    summary: {
      title: streaming
        ? `Editing ${plural(count, "file")}`
        : allReviewed
          ? WORDS.allReviewed
          : `${plural(count, "file")} changed`,
      counts: streaming || allReviewed ? "" : diffCounts(added, removed),
      countsName: streaming || allReviewed ? "" : diffCountsName(added, removed),
      progress: allReviewed
        ? [kept > 0 && `${kept} kept`, undone > 0 && `${undone} undone`].filter(Boolean).join(", ")
        : reviewed > 0
          ? `${reviewed} of ${count} reviewed`
          : "",
      allReviewed,
      undecided,
      question: `${WORDS.undoAll} ${plural(undecided, "file")}?`,
    },
  };
}
