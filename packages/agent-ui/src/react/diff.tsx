"use client";

import { codeSpans, type DiffLineView, type DiffPiece, diffPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/react/primitive";
import { type ComponentProps, Fragment, memo } from "react";

const parts = createParts(diffPrimitive, {
  root: "div",
  summary: "div",
  "summary-title": "div",
  "summary-counts": "span",
  "summary-mark": "span",
  "summary-progress": "div",
  "summary-outcome": "div",
  "summary-actions": "div",
  "undo-all": "button",
  "keep-all": "button",
  "undo-all-question": "span",
  "undo-all-cancel": "button",
  "undo-all-confirm": "button",
  "summary-error": "div",
  list: "div",
  file: "div",
  "file-trigger": "button",
  "file-path": "span",
  "file-old-path": "span",
  "file-status": "span",
  "file-counts": "span",
  "file-mark": "span",
  "file-actions": "div",
  "file-undo": "button",
  "file-keep": "button",
  "file-outcome": "span",
  "file-error": "span",
  "file-content": "div",
  "file-note": "div",
  viewport: "div",
  table: "div",
  head: "div",
  column: "span",
  change: "div",
  "change-title": "div",
  "change-undo": "button",
  "change-keep": "button",
  "change-outcome": "span",
  "change-error": "span",
  line: "div",
  "old-number": "span",
  "new-number": "span",
  sign: "span",
  code: "span",
  collapsed: "button",
  "collapsed-text": "span",
  "show-all": "button",
});

// Text with its backticks as `code`.
const withCode = (text: string) =>
  codeSpans(text).map((piece, index) =>
    // biome-ignore lint/suspicious/noArrayIndexKey: the pieces never move.
    index % 2 ? <code key={index}>{piece}</code> : <Fragment key={index}>{piece}</Fragment>,
  );

export type DiffProps = ComponentProps<typeof parts.Root>;

/**
 * One file's changes, or a run's: a summary with Keep all and Undo all, then each file's row with its own Keep and
 * Undo, opening to its lines. Any `children` replace the default parts.
 */
export function Diff({ children, ...props }: DiffProps) {
  return <parts.Root {...props}>{children !== undefined ? children : DEFAULT_PARTS}</parts.Root>;
}

/** The title, counts, progress and Keep all and Undo all, above several files. */
export const DiffSummary = parts.Summary;
/** The running mark while a patch streams. */
export const DiffSummaryMark = parts.SummaryMark;
/** Holds Undo all and Keep all, or Undo all's question. */
export const DiffSummaryActions = parts.SummaryActions;
/** Holds a file's Keep, Undo, outcome and error, at one width. */
export const DiffFileActions = parts.FileActions;
/** The running mark in place of a file's counts while its patch streams. */
export const DiffFileMark = parts.FileMark;
/** A file's lines, opened by its row. */
export const DiffFileContent = parts.FileContent;
/** Scrolls a file's lines. Holds a `DiffTable`. */
export const DiffViewport = parts.Viewport;
/** The screen-reader column headers. */
export const DiffHead = parts.Head;

export type DiffSummaryTitleProps = ComponentProps<typeof parts.SummaryTitle>;

/** "4 files changed", "Editing 2 files" or "All changes reviewed", unless you pass children. */
export function DiffSummaryTitle({ children = ({ text }) => text, ...props }: DiffSummaryTitleProps) {
  return <parts.SummaryTitle {...props}>{children}</parts.SummaryTitle>;
}

const counts = ({ added, removed, name }: { added: string; removed: string; name: string }) => (
  <>
    <span aria-hidden="true">
      {added && <span data-diff-added="">{added}</span>}
      {added && removed && " "}
      {removed && <span data-diff-removed="">{removed}</span>}
    </span>
    <span data-diff-hidden="">{name}</span>
  </>
);

export type DiffSummaryCountsProps = ComponentProps<typeof parts.SummaryCounts>;

/** "+120 −8", read as "120 additions, 8 deletions", unless you pass children. */
export function DiffSummaryCounts({ children = counts, ...props }: DiffSummaryCountsProps) {
  return <parts.SummaryCounts {...props}>{children}</parts.SummaryCounts>;
}

export type DiffSummaryProgressProps = ComponentProps<typeof parts.SummaryProgress>;

/** "2 of 4 reviewed", then "3 kept, 1 undone", unless you pass children. */
export function DiffSummaryProgress({ children = ({ text }) => text, ...props }: DiffSummaryProgressProps) {
  return <parts.SummaryProgress {...props}>{children}</parts.SummaryProgress>;
}

export type DiffSummaryOutcomeProps = ComponentProps<typeof parts.SummaryOutcome>;

/** "3 kept, 1 undone" once every change is reviewed, unless you pass children. */
export function DiffSummaryOutcome({ children = ({ text }) => text, ...props }: DiffSummaryOutcomeProps) {
  return <parts.SummaryOutcome {...props}>{children}</parts.SummaryOutcome>;
}

export type DiffUndoAllProps = ComponentProps<typeof parts.UndoAll>;

/** Asks before undoing every undecided file. "Undo all", unless you pass children. */
export function DiffUndoAll({ children = ({ text }) => text, ...props }: DiffUndoAllProps) {
  return <parts.UndoAll {...props}>{children}</parts.UndoAll>;
}

export type DiffKeepAllProps = ComponentProps<typeof parts.KeepAll>;

/** "Keep all", unless you pass children. */
export function DiffKeepAll({
  children = ({ text }) => (
    <>
      {PENDING}
      {text}
    </>
  ),
  ...props
}: DiffKeepAllProps) {
  return <parts.KeepAll {...props}>{children}</parts.KeepAll>;
}

export type DiffUndoAllQuestionProps = ComponentProps<typeof parts.UndoAllQuestion>;

/** "Undo all 4 files? This can't be undone.", unless you pass children. */
export function DiffUndoAllQuestion({
  children = ({ text, warning }) => (
    <>
      {text} <span data-diff-warning="">{warning}</span>
    </>
  ),
  ...props
}: DiffUndoAllQuestionProps) {
  return <parts.UndoAllQuestion {...props}>{children}</parts.UndoAllQuestion>;
}

export type DiffUndoAllCancelProps = ComponentProps<typeof parts.UndoAllCancel>;

/** "Cancel", unless you pass children. */
export function DiffUndoAllCancel({ children = ({ text }) => text, ...props }: DiffUndoAllCancelProps) {
  return <parts.UndoAllCancel {...props}>{children}</parts.UndoAllCancel>;
}

export type DiffUndoAllConfirmProps = ComponentProps<typeof parts.UndoAllConfirm>;

/** Undoes every undecided file. "Undo all", unless you pass children. */
export function DiffUndoAllConfirm({
  children = ({ text }) => (
    <>
      {PENDING}
      {text}
    </>
  ),
  ...props
}: DiffUndoAllConfirmProps) {
  return <parts.UndoAllConfirm {...props}>{children}</parts.UndoAllConfirm>;
}

export type DiffSummaryErrorProps = ComponentProps<typeof parts.SummaryError>;

/** "Couldn't undo all changes", unless you pass children. */
export function DiffSummaryError({ children = ({ text }) => text, ...props }: DiffSummaryErrorProps) {
  return <parts.SummaryError {...props}>{children}</parts.SummaryError>;
}

export type DiffListProps = ComponentProps<typeof parts.List>;

/** A `DiffFile` for each file, unless you pass children. */
export function DiffList({
  children = ({ paths }) => paths.map((path) => <DiffFile key={path} value={path} />),
  ...props
}: DiffListProps) {
  return <parts.List {...props}>{children}</parts.List>;
}

export type DiffFileProps = ComponentProps<typeof parts.File>;

/**
 * The file whose path is `value`: its row and its lines, unless you pass children. Memoized, so a file that didn't
 * change isn't rendered again when another streams.
 */
export const DiffFile = memo(function DiffFile({ children = FILE_PARTS, ...props }: DiffFileProps) {
  return <parts.File {...props}>{children}</parts.File>;
});

/** Opens and closes the file's lines. Holds its path, status and counts. */
export const DiffFileTrigger = parts.FileTrigger;

export type DiffFilePathProps = ComponentProps<typeof parts.FilePath>;

/** The path, cut at its start when it's long so the file name stays, unless you pass children. */
export function DiffFilePath({ children = ({ text }) => <bdi>{text}</bdi>, ...props }: DiffFilePathProps) {
  return <parts.FilePath {...props}>{children}</parts.FilePath>;
}

export type DiffFileOldPathProps = ComponentProps<typeof parts.FileOldPath>;

/** "from old/path.ts" for a rename, unless you pass children. */
export function DiffFileOldPath({
  children = ({ text }) => <bdi>{text}</bdi>,
  ...props
}: DiffFileOldPathProps) {
  return <parts.FileOldPath {...props}>{children}</parts.FileOldPath>;
}

export type DiffFileStatusProps = ComponentProps<typeof parts.FileStatus>;

/** "Added", "Deleted" or "Renamed", unless you pass children. Absent for a modified file. */
export function DiffFileStatus({ children = ({ text }) => text, ...props }: DiffFileStatusProps) {
  return <parts.FileStatus {...props}>{children}</parts.FileStatus>;
}

export type DiffFileCountsProps = ComponentProps<typeof parts.FileCounts>;

/** "+4 −2", read as "4 additions, 2 deletions", unless you pass children. */
export function DiffFileCounts({ children = counts, ...props }: DiffFileCountsProps) {
  return <parts.FileCounts {...props}>{children}</parts.FileCounts>;
}

export type DiffFileUndoProps = ComponentProps<typeof parts.FileUndo>;

/** "Undo", named with the path, unless you pass children. */
export function DiffFileUndo({ children = ({ text }) => text, ...props }: DiffFileUndoProps) {
  return <parts.FileUndo {...props}>{children}</parts.FileUndo>;
}

export type DiffFileKeepProps = ComponentProps<typeof parts.FileKeep>;

/** "Keep", named with the path, unless you pass children. */
export function DiffFileKeep({ children = ({ text }) => text, ...props }: DiffFileKeepProps) {
  return <parts.FileKeep {...props}>{children}</parts.FileKeep>;
}

const RUNNING = <span data-status-mark="" data-status="running" aria-hidden="true" />;
const PENDING = (
  <span data-kind-pending-mark="" data-status-mark="" data-status="running" aria-hidden="true" />
);

const outcome = ({ text, working }: { text: string; working: boolean }) => (
  <>
    {working && RUNNING}
    {text}
  </>
);

export type DiffFileOutcomeProps = ComponentProps<typeof parts.FileOutcome>;

/** "Kept", "Undone", "Keeping…" or "Undoing…" in the buttons' place, unless you pass children. */
export function DiffFileOutcome({ children = outcome, ...props }: DiffFileOutcomeProps) {
  return <parts.FileOutcome {...props}>{children}</parts.FileOutcome>;
}

export type DiffFileErrorProps = ComponentProps<typeof parts.FileError>;

/** "Couldn't undo `auth.ts`", unless you pass children. */
export function DiffFileError({ children = ({ text }) => withCode(text), ...props }: DiffFileErrorProps) {
  return <parts.FileError {...props}>{children}</parts.FileError>;
}

export type DiffFileNoteProps = ComponentProps<typeof parts.FileNote>;

/** "Binary file, not shown" or "Renamed, no changes" in place of lines, unless you pass children. */
export function DiffFileNote({ children = ({ text }) => text, ...props }: DiffFileNoteProps) {
  return <parts.FileNote {...props}>{children}</parts.FileNote>;
}

export type DiffColumnProps = ComponentProps<typeof parts.Column>;

/** A column's name for screen readers, unless you pass children. */
export function DiffColumn({ children = ({ text }) => text, ...props }: DiffColumnProps) {
  return <parts.Column {...props}>{children}</parts.Column>;
}

export type DiffTableProps = ComponentProps<typeof parts.Table>;

/** The column headers, then a `DiffChange` or `DiffLine` for each row, unless you pass children. */
export function DiffTable({
  children = ({ rows, columns }) => (
    <>
      <DiffHead>
        {columns.map((column) => (
          <DiffColumn key={column} value={column} />
        ))}
      </DiffHead>
      {rows.map((row) =>
        row.change ? (
          <DiffChange key={row.key} value={row.key} />
        ) : (
          <DiffLine key={row.key} value={row.key} />
        ),
      )}
    </>
  ),
  ...props
}: DiffTableProps) {
  return <parts.Table {...props}>{children}</parts.Table>;
}

export type DiffChangeProps = ComponentProps<typeof parts.Change>;

/** A change's header row, "Change 1 of 2 · line 19" with its Keep and Undo, unless you pass children. Memoized. */
export const DiffChange = memo(function DiffChange({ children = CHANGE_PARTS, ...props }: DiffChangeProps) {
  return <parts.Change {...props}>{children}</parts.Change>;
});

export type DiffChangeTitleProps = ComponentProps<typeof parts.ChangeTitle>;

/** The change's words, then its error, Undo, Keep and outcome, unless you pass children. */
export function DiffChangeTitle({
  children = ({ text }) => (
    <>
      <span data-diff-change-text="">{text}</span>
      <DiffChangeError />
      <DiffChangeUndo />
      <DiffChangeKeep />
      <DiffChangeOutcome />
    </>
  ),
  ...props
}: DiffChangeTitleProps) {
  return <parts.ChangeTitle {...props}>{children}</parts.ChangeTitle>;
}

export type DiffChangeUndoProps = ComponentProps<typeof parts.ChangeUndo>;

export function DiffChangeUndo({ children = ({ text }) => text, ...props }: DiffChangeUndoProps) {
  return <parts.ChangeUndo {...props}>{children}</parts.ChangeUndo>;
}

export type DiffChangeKeepProps = ComponentProps<typeof parts.ChangeKeep>;

export function DiffChangeKeep({ children = ({ text }) => text, ...props }: DiffChangeKeepProps) {
  return <parts.ChangeKeep {...props}>{children}</parts.ChangeKeep>;
}

export type DiffChangeOutcomeProps = ComponentProps<typeof parts.ChangeOutcome>;

export function DiffChangeOutcome({ children = outcome, ...props }: DiffChangeOutcomeProps) {
  return <parts.ChangeOutcome {...props}>{children}</parts.ChangeOutcome>;
}

export type DiffChangeErrorProps = ComponentProps<typeof parts.ChangeError>;

export function DiffChangeError({ children = ({ text }) => text, ...props }: DiffChangeErrorProps) {
  return <parts.ChangeError {...props}>{children}</parts.ChangeError>;
}

export type DiffLineProps = ComponentProps<typeof parts.Line>;

/** A line: its numbers, its sign and its code, unless you pass children. Memoized. */
export const DiffLine = memo(function DiffLine({ children = LINE_CELLS, ...props }: DiffLineProps) {
  return <parts.Line {...props}>{children}</parts.Line>;
});

/** The line's number in the old file, drawn from `data-line`, so a copy holds only code. */
export const DiffOldNumber = parts.OldNumber;
/** The line's number in the new file, drawn from `data-line`. */
export const DiffNewNumber = parts.NewNumber;
/** `+` or `−`, drawn from `data-sign`. */
export const DiffSign = parts.Sign;

const Piece = ({ piece }: { piece: DiffPiece }) => (
  <span
    style={piece.color ? { color: piece.color } : undefined}
    data-diff-changed={piece.changed ? "" : undefined}
    data-italic={piece.fontStyle === "italic" ? "" : undefined}
    data-bold={piece.fontStyle === "bold" ? "" : undefined}
  >
    {piece.text}
  </span>
);

const code = (line: DiffLineView | undefined) => {
  if (!line) return null;
  if (line.kind === "collapsed") {
    return (
      <>
        <DiffCollapsed />
        <DiffCollapsedText />
      </>
    );
  }
  const pieces = line.pieces.map((piece, index) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: a line's pieces are drawn again as a whole.
    <Piece key={index} piece={piece} />
  ));
  const Tag = line.kind === "add" ? "ins" : line.kind === "remove" ? "del" : Fragment;
  return (
    <>
      {line.prefix && <span data-diff-hidden="">{line.prefix} </span>}
      <Tag>{pieces}</Tag>
    </>
  );
};

export type DiffCodeProps = ComponentProps<typeof parts.Code>;

/**
 * The line's code, in `ins` or `del` with its changed words marked and hidden words for screen readers, or a
 * collapsed run's `DiffCollapsed` and `DiffCollapsedText`, unless you pass children.
 */
export function DiffCode({ children = ({ line }) => code(line), ...props }: DiffCodeProps) {
  return <parts.Code {...props}>{children}</parts.Code>;
}

export type DiffCollapsedProps = ComponentProps<typeof parts.Collapsed>;

/** "Show 12 lines", unless you pass children. Its name says where they are. */
export function DiffCollapsed({ children = ({ text }) => text, ...props }: DiffCollapsedProps) {
  return <parts.Collapsed {...props}>{children}</parts.Collapsed>;
}

export type DiffCollapsedTextProps = ComponentProps<typeof parts.CollapsedText>;

/** The collapsed lines, hidden until find in page matches one, unless you pass children. */
export function DiffCollapsedText({ children = ({ text }) => text, ...props }: DiffCollapsedTextProps) {
  return <parts.CollapsedText {...props}>{children}</parts.CollapsedText>;
}

export type DiffShowAllProps = ComponentProps<typeof parts.ShowAll>;

/** "Show full diff (6,400 lines)" for a file cut off at 2,000 rows, unless you pass children. */
export function DiffShowAll({ children = ({ text }) => text, ...props }: DiffShowAllProps) {
  return <parts.ShowAll {...props}>{children}</parts.ShowAll>;
}

// Shared, so an update doesn't render the default parts' wrappers again.

const LINE_CELLS = (
  <>
    <DiffOldNumber />
    <DiffNewNumber />
    <DiffSign />
    <DiffCode />
  </>
);

const CHANGE_PARTS = <DiffChangeTitle />;

const FILE_PARTS = (
  <>
    <DiffFileTrigger>
      <span data-diff-name="">
        <DiffFilePath />
        <DiffFileOldPath />
      </span>
      <DiffFileStatus />
      <DiffFileCounts />
      <DiffFileMark />
    </DiffFileTrigger>
    <DiffFileActions>
      <DiffFileError />
      <DiffFileUndo />
      <DiffFileKeep />
      <DiffFileOutcome />
    </DiffFileActions>
    <DiffFileContent>
      <DiffFileNote />
      <DiffViewport>
        <DiffTable />
        <DiffShowAll />
      </DiffViewport>
    </DiffFileContent>
  </>
);

const DEFAULT_PARTS = (
  <>
    <DiffSummary>
      <div data-diff-heading="">
        <DiffSummaryTitle />
        <DiffSummaryCounts />
        <DiffSummaryProgress />
        <DiffSummaryOutcome />
      </div>
      <DiffSummaryMark />
      <DiffSummaryActions>
        <DiffUndoAllQuestion />
        <DiffUndoAll />
        <DiffKeepAll />
        <DiffUndoAllCancel />
        <DiffUndoAllConfirm />
      </DiffSummaryActions>
      <DiffSummaryError />
    </DiffSummary>
    <DiffList />
  </>
);
