import {
  codeSpans,
  type DiffLineView,
  type DiffPiece,
  type DiffTableRow,
  diffPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, h } from "vue";

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

// `$stable` tells Vue these slots never change, so a part that renders again doesn't render the parts inside it.
const stable = (slot: () => unknown) => ({ default: slot, $stable: true });

// A part that fills an empty default slot from its state.
const withDefault = <Part>(part: Part, name: string, fill: (state: never) => unknown) =>
  defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () =>
        h(part as never, attrs, {
          ...slots,
          default: slots.default ?? (({ state }: { state: never }) => fill(state)),
        });
    },
  }) as unknown as Part;

type Text = { text: string };
const text = (state: Text) => state.text;

// Text with its backticks as `code`.
const withCode = (value: string) =>
  codeSpans(value).map((piece, index) => (index % 2 ? h("code", { key: index }, piece) : piece));

const running = () => h("span", { "data-status-mark": "", "data-status": "running", "aria-hidden": "true" });
const pending = () =>
  h("span", {
    "data-kind-pending-mark": "",
    "data-status-mark": "",
    "data-status": "running",
    "aria-hidden": "true",
  });

const counts = (state: { added: string; removed: string; name: string }) => {
  const { added, removed } = state;
  return [
    h("span", { "aria-hidden": "true" }, [
      added ? h("span", { "data-diff-added": "" }, added) : null,
      added && removed ? " " : null,
      removed ? h("span", { "data-diff-removed": "" }, removed) : null,
    ]),
    h("span", { "data-diff-hidden": "" }, state.name),
  ];
};

const outcome = (state: { text: string; working: boolean }) => [state.working ? running() : null, state.text];

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
/** Opens and closes the file's lines. Holds its path, status and counts. */
export const DiffFileTrigger = parts.FileTrigger;
/** The line's number in the old file, drawn from `data-line`, so a copy holds only code. */
export const DiffOldNumber = parts.OldNumber;
/** The line's number in the new file, drawn from `data-line`. */
export const DiffNewNumber = parts.NewNumber;
/** `+` or `−`, drawn from `data-sign`. */
export const DiffSign = parts.Sign;

/** "4 files changed", "Editing 2 files" or "All changes reviewed", unless you fill the default slot. */
export const DiffSummaryTitle = withDefault(parts.SummaryTitle, "DiffSummaryTitle", text);

/** "+120 −8", read as "120 additions, 8 deletions", unless you fill the default slot. */
export const DiffSummaryCounts = withDefault(parts.SummaryCounts, "DiffSummaryCounts", counts);

/** "2 of 4 reviewed", then "3 kept, 1 undone", unless you fill the default slot. */
export const DiffSummaryProgress = withDefault(parts.SummaryProgress, "DiffSummaryProgress", text);

/** "3 kept, 1 undone" once every change is reviewed, unless you fill the default slot. */
export const DiffSummaryOutcome = withDefault(parts.SummaryOutcome, "DiffSummaryOutcome", text);

/** Asks before undoing every undecided file. "Undo all", unless you fill the default slot. */
export const DiffUndoAll = withDefault(parts.UndoAll, "DiffUndoAll", text);

/** "Keep all", unless you fill the default slot. */
export const DiffKeepAll = withDefault(parts.KeepAll, "DiffKeepAll", (state: Text) => [
  pending(),
  state.text,
]);

/** "Undo all 4 files? This can't be undone.", unless you fill the default slot. */
export const DiffUndoAllQuestion = withDefault(
  parts.UndoAllQuestion,
  "DiffUndoAllQuestion",
  (state: { text: string; warning: string }) => [
    state.text,
    " ",
    h("span", { "data-diff-warning": "" }, state.warning),
  ],
);

/** "Cancel", unless you fill the default slot. */
export const DiffUndoAllCancel = withDefault(parts.UndoAllCancel, "DiffUndoAllCancel", text);

/** Undoes every undecided file. "Undo all", unless you fill the default slot. */
export const DiffUndoAllConfirm = withDefault(parts.UndoAllConfirm, "DiffUndoAllConfirm", (state: Text) => [
  pending(),
  state.text,
]);

/** "Couldn't undo all changes", unless you fill the default slot. */
export const DiffSummaryError = withDefault(parts.SummaryError, "DiffSummaryError", text);

/** The path, cut at its start when it's long so the file name stays, unless you fill the default slot. */
export const DiffFilePath = withDefault(parts.FilePath, "DiffFilePath", (state: Text) =>
  h("bdi", state.text),
);

/** "from old/path.ts" for a rename, unless you fill the default slot. */
export const DiffFileOldPath = withDefault(parts.FileOldPath, "DiffFileOldPath", (state: Text) =>
  h("bdi", state.text),
);

/** "Added", "Deleted" or "Renamed", unless you fill the default slot. Absent for a modified file. */
export const DiffFileStatus = withDefault(parts.FileStatus, "DiffFileStatus", text);

/** "+4 −2", read as "4 additions, 2 deletions", unless you fill the default slot. */
export const DiffFileCounts = withDefault(parts.FileCounts, "DiffFileCounts", counts);

/** "Undo", named with the path, unless you fill the default slot. */
export const DiffFileUndo = withDefault(parts.FileUndo, "DiffFileUndo", text);

/** "Keep", named with the path, unless you fill the default slot. */
export const DiffFileKeep = withDefault(parts.FileKeep, "DiffFileKeep", text);

/** "Kept", "Undone", "Keeping…" or "Undoing…" in the buttons' place, unless you fill the default slot. */
export const DiffFileOutcome = withDefault(parts.FileOutcome, "DiffFileOutcome", outcome);

/** "Couldn't undo `auth.ts`", unless you fill the default slot. */
export const DiffFileError = withDefault(parts.FileError, "DiffFileError", (state: Text) =>
  withCode(state.text),
);

/** "Binary file, not shown" or "Renamed, no changes" in place of lines, unless you fill the default slot. */
export const DiffFileNote = withDefault(parts.FileNote, "DiffFileNote", text);

/** A column's name for screen readers, unless you fill the default slot. */
export const DiffColumn = withDefault(parts.Column, "DiffColumn", text);

export const DiffChangeUndo = withDefault(parts.ChangeUndo, "DiffChangeUndo", text);
export const DiffChangeKeep = withDefault(parts.ChangeKeep, "DiffChangeKeep", text);
export const DiffChangeOutcome = withDefault(parts.ChangeOutcome, "DiffChangeOutcome", outcome);
export const DiffChangeError = withDefault(parts.ChangeError, "DiffChangeError", text);

/** The change's words, then its error, Undo, Keep and outcome, unless you fill the default slot. */
export const DiffChangeTitle = withDefault(parts.ChangeTitle, "DiffChangeTitle", (state: Text) => [
  h("span", { "data-diff-change-text": "" }, state.text),
  h(DiffChangeError),
  h(DiffChangeUndo),
  h(DiffChangeKeep),
  h(DiffChangeOutcome),
]);

/**
 * A change's header row, "Change 1 of 2 · line 19" with its Keep and Undo, unless you fill the default slot. Renders
 * again only when its props change.
 */
export const DiffChange = withDefault(parts.Change, "DiffChange", () => h(DiffChangeTitle));

/** "Show 12 lines", unless you fill the default slot. Its name says where they are. */
export const DiffCollapsed = withDefault(parts.Collapsed, "DiffCollapsed", text);

/** The collapsed lines, hidden until find in page matches one, unless you fill the default slot. */
export const DiffCollapsedText = withDefault(parts.CollapsedText, "DiffCollapsedText", text);

const piece = (part: DiffPiece, index: number) =>
  h(
    "span",
    {
      key: index,
      style: part.color ? { color: part.color } : undefined,
      "data-diff-changed": part.changed ? "" : undefined,
      "data-italic": part.fontStyle === "italic" ? "" : undefined,
      "data-bold": part.fontStyle === "bold" ? "" : undefined,
    },
    part.text,
  );

const code = (line: DiffLineView | undefined) => {
  if (!line) return null;
  if (line.kind === "collapsed") return [h(DiffCollapsed), h(DiffCollapsedText)];
  const pieces = line.pieces.map(piece);
  return [
    line.prefix ? h("span", { "data-diff-hidden": "" }, `${line.prefix} `) : null,
    line.kind === "add" ? h("ins", pieces) : line.kind === "remove" ? h("del", pieces) : pieces,
  ];
};

/**
 * The line's code, in `ins` or `del` with its changed words marked and hidden words for screen readers, or a
 * collapsed run's `DiffCollapsed` and `DiffCollapsedText`, unless you fill the default slot.
 */
export const DiffCode = withDefault(parts.Code, "DiffCode", (state: { line: DiffLineView | undefined }) =>
  code(state.line),
);

/** A line: its numbers, its sign and its code, unless you fill the default slot. Renders again only when its props change. */
export const DiffLine = withDefault(parts.Line, "DiffLine", () => [
  h(DiffOldNumber),
  h(DiffNewNumber),
  h(DiffSign),
  h(DiffCode),
]);

/** The column headers, then a `DiffChange` or `DiffLine` for each row, unless you fill the default slot. */
export const DiffTable = withDefault(
  parts.Table,
  "DiffTable",
  (state: { rows: readonly DiffTableRow[]; columns: readonly string[] }) => {
    const { columns } = state;
    return [
      h(DiffHead, null, () => columns.map((column) => h(DiffColumn, { key: column, value: column }))),
      ...state.rows.map((row) =>
        h(row.change ? DiffChange : DiffLine, { key: row.key, value: row.key } as never),
      ),
    ];
  },
);

/** "Show full diff (6,400 lines)" for a file cut off at 2,000 rows, unless you fill the default slot. */
export const DiffShowAll = withDefault(parts.ShowAll, "DiffShowAll", text);

const fileParts = () => [
  h(
    DiffFileTrigger,
    null,
    stable(() => [
      h("span", { "data-diff-name": "" }, [h(DiffFilePath), h(DiffFileOldPath)]),
      h(DiffFileStatus),
      h(DiffFileCounts),
      h(DiffFileMark),
    ]),
  ),
  h(
    DiffFileActions,
    null,
    stable(() => [h(DiffFileError), h(DiffFileUndo), h(DiffFileKeep), h(DiffFileOutcome)]),
  ),
  h(
    DiffFileContent,
    null,
    stable(() => [
      h(DiffFileNote),
      h(
        DiffViewport,
        null,
        stable(() => [h(DiffTable), h(DiffShowAll)]),
      ),
    ]),
  ),
];

/**
 * The file whose path is `value`: its row and its lines, unless you fill the default slot. Renders again only when
 * its props change, so a file that didn't change isn't rendered again when another streams.
 */
export const DiffFile = withDefault(parts.File, "DiffFile", fileParts);

/** A `DiffFile` for each file, unless you fill the default slot. */
export const DiffList = withDefault(parts.List, "DiffList", (state: { paths: readonly string[] }) =>
  state.paths.map((path) => h(DiffFile, { key: path, value: path })),
);

const defaultParts = () => [
  h(
    DiffSummary,
    null,
    stable(() => [
      h("div", { "data-diff-heading": "" }, [
        h(DiffSummaryTitle),
        h(DiffSummaryCounts),
        h(DiffSummaryProgress),
        h(DiffSummaryOutcome),
      ]),
      h(DiffSummaryMark),
      h(
        DiffSummaryActions,
        null,
        stable(() => [
          h(DiffUndoAllQuestion),
          h(DiffUndoAll),
          h(DiffKeepAll),
          h(DiffUndoAllCancel),
          h(DiffUndoAllConfirm),
        ]),
      ),
      h(DiffSummaryError),
    ]),
  ),
  h(DiffList),
];

/**
 * One file's changes, or a run's: a summary with Keep all and Undo all, then each file's row with its own Keep and
 * Undo, opening to its lines. A default slot replaces the default parts.
 */
export const Diff = defineComponent({
  name: "Diff",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(parts.Root, attrs, { ...slots, default: slots.default ?? defaultParts });
  },
}) as unknown as typeof parts.Root;
