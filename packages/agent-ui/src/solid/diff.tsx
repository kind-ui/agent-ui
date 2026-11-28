import { codeSpans, type DiffLineView, type DiffPiece, diffPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, Match, omit, Show, Switch } from "solid-js";

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
  codeSpans(text).map((piece, index) => (index % 2 ? <code>{piece}</code> : piece));

export type DiffProps = ComponentProps<typeof parts.Root>;

/**
 * One file's changes, or a run's: a summary with Keep all and Undo all, then each file's row with its own Keep and
 * Undo, opening to its lines. Any `children` replace the default parts.
 */
export function Diff(props: DiffProps) {
  return <parts.Root {...omit(props, "children")}>{props.children ?? <DefaultParts />}</parts.Root>;
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
export function DiffSummaryTitle(props: DiffSummaryTitleProps) {
  return (
    <parts.SummaryTitle {...omit(props, "children")}>
      {props.children ?? ((state) => state.text)}
    </parts.SummaryTitle>
  );
}

const counts = (state: { added: string; removed: string; name: string }): JSX.Element => (
  <>
    <span aria-hidden="true">
      <Show when={state.added}>
        <span data-diff-added="">{state.added}</span>
      </Show>
      <Show when={state.added && state.removed}> </Show>
      <Show when={state.removed}>
        <span data-diff-removed="">{state.removed}</span>
      </Show>
    </span>
    <span data-diff-hidden="">{state.name}</span>
  </>
);

export type DiffSummaryCountsProps = ComponentProps<typeof parts.SummaryCounts>;

/** "+120 −8", read as "120 additions, 8 deletions", unless you pass children. */
export function DiffSummaryCounts(props: DiffSummaryCountsProps) {
  return <parts.SummaryCounts {...omit(props, "children")}>{props.children ?? counts}</parts.SummaryCounts>;
}

export type DiffSummaryProgressProps = ComponentProps<typeof parts.SummaryProgress>;

/** "2 of 4 reviewed", then "3 kept, 1 undone", unless you pass children. */
export function DiffSummaryProgress(props: DiffSummaryProgressProps) {
  return (
    <parts.SummaryProgress {...omit(props, "children")}>
      {props.children ?? ((state) => state.text)}
    </parts.SummaryProgress>
  );
}

export type DiffSummaryOutcomeProps = ComponentProps<typeof parts.SummaryOutcome>;

/** "3 kept, 1 undone" once every change is reviewed, unless you pass children. */
export function DiffSummaryOutcome(props: DiffSummaryOutcomeProps) {
  return (
    <parts.SummaryOutcome {...omit(props, "children")}>
      {props.children ?? ((state) => state.text)}
    </parts.SummaryOutcome>
  );
}

export type DiffUndoAllProps = ComponentProps<typeof parts.UndoAll>;

/** Asks before undoing every undecided file. "Undo all", unless you pass children. */
export function DiffUndoAll(props: DiffUndoAllProps) {
  return (
    <parts.UndoAll {...omit(props, "children")}>{props.children ?? ((state) => state.text)}</parts.UndoAll>
  );
}

const Running = () => <span data-status-mark="" data-status="running" aria-hidden="true" />;
const Pending = () => (
  <span data-kind-pending-mark="" data-status-mark="" data-status="running" aria-hidden="true" />
);

export type DiffKeepAllProps = ComponentProps<typeof parts.KeepAll>;

/** "Keep all", unless you pass children. */
export function DiffKeepAll(props: DiffKeepAllProps) {
  return (
    <parts.KeepAll {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <>
            <Pending />
            {state.text}
          </>
        ))}
    </parts.KeepAll>
  );
}

export type DiffUndoAllQuestionProps = ComponentProps<typeof parts.UndoAllQuestion>;

/** "Undo all 4 files? This can't be undone.", unless you pass children. */
export function DiffUndoAllQuestion(props: DiffUndoAllQuestionProps) {
  return (
    <parts.UndoAllQuestion {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <>
            {state.text} <span data-diff-warning="">{state.warning}</span>
          </>
        ))}
    </parts.UndoAllQuestion>
  );
}

export type DiffUndoAllCancelProps = ComponentProps<typeof parts.UndoAllCancel>;

/** "Cancel", unless you pass children. */
export function DiffUndoAllCancel(props: DiffUndoAllCancelProps) {
  return (
    <parts.UndoAllCancel {...omit(props, "children")}>
      {props.children ?? ((state) => state.text)}
    </parts.UndoAllCancel>
  );
}

export type DiffUndoAllConfirmProps = ComponentProps<typeof parts.UndoAllConfirm>;

/** Undoes every undecided file. "Undo all", unless you pass children. */
export function DiffUndoAllConfirm(props: DiffUndoAllConfirmProps) {
  return (
    <parts.UndoAllConfirm {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <>
            <Pending />
            {state.text}
          </>
        ))}
    </parts.UndoAllConfirm>
  );
}

export type DiffSummaryErrorProps = ComponentProps<typeof parts.SummaryError>;

/** "Couldn't undo all changes", unless you pass children. */
export function DiffSummaryError(props: DiffSummaryErrorProps) {
  return (
    <parts.SummaryError {...omit(props, "children")}>
      {props.children ?? ((state) => state.text)}
    </parts.SummaryError>
  );
}

export type DiffListProps = ComponentProps<typeof parts.List>;

/** A `DiffFile` for each file, keyed by its path, unless you pass children. */
export function DiffList(props: DiffListProps) {
  return (
    <parts.List {...omit(props, "children")}>
      {props.children ?? ((state) => <For each={state.paths}>{(path) => <DiffFile value={path} />}</For>)}
    </parts.List>
  );
}

export type DiffFileProps = ComponentProps<typeof parts.File>;

/** The file whose path is `value`: its row and its lines, unless you pass children. */
export function DiffFile(props: DiffFileProps) {
  return <parts.File {...omit(props, "children")}>{props.children ?? <FileParts />}</parts.File>;
}

/** Opens and closes the file's lines. Holds its path, status and counts. */
export const DiffFileTrigger = parts.FileTrigger;

export type DiffFilePathProps = ComponentProps<typeof parts.FilePath>;

/** The path, cut at its start when it's long so the file name stays, unless you pass children. */
export function DiffFilePath(props: DiffFilePathProps) {
  return (
    <parts.FilePath {...omit(props, "children")}>
      {props.children ?? ((state) => <bdi>{state.text}</bdi>)}
    </parts.FilePath>
  );
}

export type DiffFileOldPathProps = ComponentProps<typeof parts.FileOldPath>;

/** "from old/path.ts" for a rename, unless you pass children. */
export function DiffFileOldPath(props: DiffFileOldPathProps) {
  return (
    <parts.FileOldPath {...omit(props, "children")}>
      {props.children ?? ((state) => <bdi>{state.text}</bdi>)}
    </parts.FileOldPath>
  );
}

export type DiffFileStatusProps = ComponentProps<typeof parts.FileStatus>;

/** "Added", "Deleted" or "Renamed", unless you pass children. Absent for a modified file. */
export function DiffFileStatus(props: DiffFileStatusProps) {
  return (
    <parts.FileStatus {...omit(props, "children")}>
      {props.children ?? ((state) => state.text)}
    </parts.FileStatus>
  );
}

export type DiffFileCountsProps = ComponentProps<typeof parts.FileCounts>;

/** "+4 −2", read as "4 additions, 2 deletions", unless you pass children. */
export function DiffFileCounts(props: DiffFileCountsProps) {
  return <parts.FileCounts {...omit(props, "children")}>{props.children ?? counts}</parts.FileCounts>;
}

export type DiffFileUndoProps = ComponentProps<typeof parts.FileUndo>;

/** "Undo", named with the path, unless you pass children. */
export function DiffFileUndo(props: DiffFileUndoProps) {
  return (
    <parts.FileUndo {...omit(props, "children")}>{props.children ?? ((state) => state.text)}</parts.FileUndo>
  );
}

export type DiffFileKeepProps = ComponentProps<typeof parts.FileKeep>;

/** "Keep", named with the path, unless you pass children. */
export function DiffFileKeep(props: DiffFileKeepProps) {
  return (
    <parts.FileKeep {...omit(props, "children")}>{props.children ?? ((state) => state.text)}</parts.FileKeep>
  );
}

const outcome = (state: { text: string; working: boolean }): JSX.Element => (
  <>
    <Show when={state.working}>
      <Running />
    </Show>
    {state.text}
  </>
);

export type DiffFileOutcomeProps = ComponentProps<typeof parts.FileOutcome>;

/** "Kept", "Undone", "Keeping…" or "Undoing…" in the buttons' place, unless you pass children. */
export function DiffFileOutcome(props: DiffFileOutcomeProps) {
  return <parts.FileOutcome {...omit(props, "children")}>{props.children ?? outcome}</parts.FileOutcome>;
}

export type DiffFileErrorProps = ComponentProps<typeof parts.FileError>;

/** "Couldn't undo `auth.ts`", unless you pass children. */
export function DiffFileError(props: DiffFileErrorProps) {
  return (
    <parts.FileError {...omit(props, "children")}>
      {props.children ?? ((state) => <>{withCode(state.text)}</>)}
    </parts.FileError>
  );
}

export type DiffFileNoteProps = ComponentProps<typeof parts.FileNote>;

/** "Binary file, not shown" or "Renamed, no changes" in place of lines, unless you pass children. */
export function DiffFileNote(props: DiffFileNoteProps) {
  return (
    <parts.FileNote {...omit(props, "children")}>{props.children ?? ((state) => state.text)}</parts.FileNote>
  );
}

export type DiffColumnProps = ComponentProps<typeof parts.Column>;

/** A column's name for screen readers, unless you pass children. */
export function DiffColumn(props: DiffColumnProps) {
  return (
    <parts.Column {...omit(props, "children")}>{props.children ?? ((state) => state.text)}</parts.Column>
  );
}

export type DiffTableProps = ComponentProps<typeof parts.Table>;

/** The column headers, then a `DiffChange` or `DiffLine` for each row, keyed by its key, unless you pass children. */
export function DiffTable(props: DiffTableProps) {
  return (
    <parts.Table {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <>
            <DiffHead>
              <For each={state.columns}>{(column) => <DiffColumn value={column} />}</For>
            </DiffHead>
            <For each={state.rows} keyed={(row) => row.key}>
              {(row) => (
                <Show when={row().change} fallback={<DiffLine value={row().key} />}>
                  <DiffChange value={row().key} />
                </Show>
              )}
            </For>
          </>
        ))}
    </parts.Table>
  );
}

export type DiffChangeProps = ComponentProps<typeof parts.Change>;

/** A change's header row, "Change 1 of 2 · line 19" with its Keep and Undo, unless you pass children. */
export function DiffChange(props: DiffChangeProps) {
  return <parts.Change {...omit(props, "children")}>{props.children ?? <DiffChangeTitle />}</parts.Change>;
}

export type DiffChangeTitleProps = ComponentProps<typeof parts.ChangeTitle>;

/** The change's words, then its error, Undo, Keep and outcome, unless you pass children. */
export function DiffChangeTitle(props: DiffChangeTitleProps) {
  return (
    <parts.ChangeTitle {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <>
            <span data-diff-change-text="">{state.text}</span>
            <DiffChangeError />
            <DiffChangeUndo />
            <DiffChangeKeep />
            <DiffChangeOutcome />
          </>
        ))}
    </parts.ChangeTitle>
  );
}

export type DiffChangeUndoProps = ComponentProps<typeof parts.ChangeUndo>;

export function DiffChangeUndo(props: DiffChangeUndoProps) {
  return (
    <parts.ChangeUndo {...omit(props, "children")}>
      {props.children ?? ((state) => state.text)}
    </parts.ChangeUndo>
  );
}

export type DiffChangeKeepProps = ComponentProps<typeof parts.ChangeKeep>;

export function DiffChangeKeep(props: DiffChangeKeepProps) {
  return (
    <parts.ChangeKeep {...omit(props, "children")}>
      {props.children ?? ((state) => state.text)}
    </parts.ChangeKeep>
  );
}

export type DiffChangeOutcomeProps = ComponentProps<typeof parts.ChangeOutcome>;

export function DiffChangeOutcome(props: DiffChangeOutcomeProps) {
  return <parts.ChangeOutcome {...omit(props, "children")}>{props.children ?? outcome}</parts.ChangeOutcome>;
}

export type DiffChangeErrorProps = ComponentProps<typeof parts.ChangeError>;

export function DiffChangeError(props: DiffChangeErrorProps) {
  return (
    <parts.ChangeError {...omit(props, "children")}>
      {props.children ?? ((state) => state.text)}
    </parts.ChangeError>
  );
}

export type DiffLineProps = ComponentProps<typeof parts.Line>;

/** A line: its numbers, its sign and its code, unless you pass children. */
export function DiffLine(props: DiffLineProps) {
  return <parts.Line {...omit(props, "children")}>{props.children ?? <LineCells />}</parts.Line>;
}

/** The line's number in the old file, drawn from `data-line`, so a copy holds only code. */
export const DiffOldNumber = parts.OldNumber;
/** The line's number in the new file, drawn from `data-line`. */
export const DiffNewNumber = parts.NewNumber;
/** `+` or `−`, drawn from `data-sign`. */
export const DiffSign = parts.Sign;

const Pieces = (props: { pieces: readonly DiffPiece[] }) => (
  <For each={props.pieces} keyed={false}>
    {(piece) => (
      <span
        style={piece().color ? { color: piece().color } : undefined}
        data-diff-changed={piece().changed ? "" : undefined}
        data-italic={piece().fontStyle === "italic" ? "" : undefined}
        data-bold={piece().fontStyle === "bold" ? "" : undefined}
      >
        {piece().text}
      </span>
    )}
  </For>
);

const Code = (props: { line: DiffLineView }) => (
  <Show
    when={props.line.kind !== "collapsed"}
    fallback={
      <>
        <DiffCollapsed />
        <DiffCollapsedText />
      </>
    }
  >
    <Show when={props.line.prefix}>
      <span data-diff-hidden="">{props.line.prefix} </span>
    </Show>
    <Switch fallback={<Pieces pieces={props.line.pieces} />}>
      <Match when={props.line.kind === "add"}>
        <ins>
          <Pieces pieces={props.line.pieces} />
        </ins>
      </Match>
      <Match when={props.line.kind === "remove"}>
        <del>
          <Pieces pieces={props.line.pieces} />
        </del>
      </Match>
    </Switch>
  </Show>
);

export type DiffCodeProps = ComponentProps<typeof parts.Code>;

/**
 * The line's code, in `ins` or `del` with its changed words marked and hidden words for screen readers, or a
 * collapsed run's `DiffCollapsed` and `DiffCollapsedText`, unless you pass children.
 */
export function DiffCode(props: DiffCodeProps) {
  return (
    <parts.Code {...omit(props, "children")}>
      {props.children ?? ((state) => <Show when={state.line}>{(line) => <Code line={line()} />}</Show>)}
    </parts.Code>
  );
}

export type DiffCollapsedProps = ComponentProps<typeof parts.Collapsed>;

/** "Show 12 lines", unless you pass children. Its name says where they are. */
export function DiffCollapsed(props: DiffCollapsedProps) {
  return (
    <parts.Collapsed {...omit(props, "children")}>
      {props.children ?? ((state) => state.text)}
    </parts.Collapsed>
  );
}

export type DiffCollapsedTextProps = ComponentProps<typeof parts.CollapsedText>;

/** The collapsed lines, hidden until find in page matches one, unless you pass children. */
export function DiffCollapsedText(props: DiffCollapsedTextProps) {
  return (
    <parts.CollapsedText {...omit(props, "children")}>
      {props.children ?? ((state) => state.text)}
    </parts.CollapsedText>
  );
}

export type DiffShowAllProps = ComponentProps<typeof parts.ShowAll>;

/** "Show full diff (6,400 lines)" for a file cut off at 2,000 rows, unless you pass children. */
export function DiffShowAll(props: DiffShowAllProps) {
  return (
    <parts.ShowAll {...omit(props, "children")}>{props.children ?? ((state) => state.text)}</parts.ShowAll>
  );
}

function LineCells() {
  return (
    <>
      <DiffOldNumber />
      <DiffNewNumber />
      <DiffSign />
      <DiffCode />
    </>
  );
}

function FileParts() {
  return (
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
}

function DefaultParts() {
  return (
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
}
