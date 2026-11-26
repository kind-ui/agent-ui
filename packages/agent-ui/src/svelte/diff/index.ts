import type { ComponentProps } from "svelte";
import Diff from "./Diff.svelte";
import DiffChange from "./DiffChange.svelte";
import DiffChangeError from "./DiffChangeError.svelte";
import DiffChangeKeep from "./DiffChangeKeep.svelte";
import DiffChangeOutcome from "./DiffChangeOutcome.svelte";
import DiffChangeTitle from "./DiffChangeTitle.svelte";
import DiffChangeUndo from "./DiffChangeUndo.svelte";
import DiffCode from "./DiffCode.svelte";
import DiffCollapsed from "./DiffCollapsed.svelte";
import DiffCollapsedText from "./DiffCollapsedText.svelte";
import DiffColumn from "./DiffColumn.svelte";
import DiffFile from "./DiffFile.svelte";
import DiffFileCounts from "./DiffFileCounts.svelte";
import DiffFileError from "./DiffFileError.svelte";
import DiffFileKeep from "./DiffFileKeep.svelte";
import DiffFileNote from "./DiffFileNote.svelte";
import DiffFileOldPath from "./DiffFileOldPath.svelte";
import DiffFileOutcome from "./DiffFileOutcome.svelte";
import DiffFilePath from "./DiffFilePath.svelte";
import DiffFileStatus from "./DiffFileStatus.svelte";
import DiffFileUndo from "./DiffFileUndo.svelte";
import DiffKeepAll from "./DiffKeepAll.svelte";
import DiffLine from "./DiffLine.svelte";
import DiffList from "./DiffList.svelte";
import DiffShowAll from "./DiffShowAll.svelte";
import DiffSummaryCounts from "./DiffSummaryCounts.svelte";
import DiffSummaryError from "./DiffSummaryError.svelte";
import DiffSummaryOutcome from "./DiffSummaryOutcome.svelte";
import DiffSummaryProgress from "./DiffSummaryProgress.svelte";
import DiffSummaryTitle from "./DiffSummaryTitle.svelte";
import DiffTable from "./DiffTable.svelte";
import DiffUndoAll from "./DiffUndoAll.svelte";
import DiffUndoAllCancel from "./DiffUndoAllCancel.svelte";
import DiffUndoAllConfirm from "./DiffUndoAllConfirm.svelte";
import DiffUndoAllQuestion from "./DiffUndoAllQuestion.svelte";
import { parts } from "./parts.js";

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

export {
  Diff,
  DiffChange,
  DiffChangeError,
  DiffChangeKeep,
  DiffChangeOutcome,
  DiffChangeTitle,
  DiffChangeUndo,
  DiffCode,
  DiffCollapsed,
  DiffCollapsedText,
  DiffColumn,
  DiffFile,
  DiffFileCounts,
  DiffFileError,
  DiffFileKeep,
  DiffFileNote,
  DiffFileOldPath,
  DiffFileOutcome,
  DiffFilePath,
  DiffFileStatus,
  DiffFileUndo,
  DiffKeepAll,
  DiffLine,
  DiffList,
  DiffShowAll,
  DiffSummaryCounts,
  DiffSummaryError,
  DiffSummaryOutcome,
  DiffSummaryProgress,
  DiffSummaryTitle,
  DiffTable,
  DiffUndoAll,
  DiffUndoAllCancel,
  DiffUndoAllConfirm,
  DiffUndoAllQuestion,
};

export type DiffProps = ComponentProps<typeof Diff>;
export type DiffSummaryTitleProps = ComponentProps<typeof DiffSummaryTitle>;
export type DiffSummaryCountsProps = ComponentProps<typeof DiffSummaryCounts>;
export type DiffSummaryProgressProps = ComponentProps<typeof DiffSummaryProgress>;
export type DiffSummaryOutcomeProps = ComponentProps<typeof DiffSummaryOutcome>;
export type DiffUndoAllProps = ComponentProps<typeof DiffUndoAll>;
export type DiffKeepAllProps = ComponentProps<typeof DiffKeepAll>;
export type DiffUndoAllQuestionProps = ComponentProps<typeof DiffUndoAllQuestion>;
export type DiffUndoAllCancelProps = ComponentProps<typeof DiffUndoAllCancel>;
export type DiffUndoAllConfirmProps = ComponentProps<typeof DiffUndoAllConfirm>;
export type DiffSummaryErrorProps = ComponentProps<typeof DiffSummaryError>;
export type DiffListProps = ComponentProps<typeof DiffList>;
export type DiffFileProps = ComponentProps<typeof DiffFile>;
export type DiffFilePathProps = ComponentProps<typeof DiffFilePath>;
export type DiffFileOldPathProps = ComponentProps<typeof DiffFileOldPath>;
export type DiffFileStatusProps = ComponentProps<typeof DiffFileStatus>;
export type DiffFileCountsProps = ComponentProps<typeof DiffFileCounts>;
export type DiffFileUndoProps = ComponentProps<typeof DiffFileUndo>;
export type DiffFileKeepProps = ComponentProps<typeof DiffFileKeep>;
export type DiffFileOutcomeProps = ComponentProps<typeof DiffFileOutcome>;
export type DiffFileErrorProps = ComponentProps<typeof DiffFileError>;
export type DiffFileNoteProps = ComponentProps<typeof DiffFileNote>;
export type DiffColumnProps = ComponentProps<typeof DiffColumn>;
export type DiffTableProps = ComponentProps<typeof DiffTable>;
export type DiffChangeProps = ComponentProps<typeof DiffChange>;
export type DiffChangeTitleProps = ComponentProps<typeof DiffChangeTitle>;
export type DiffChangeUndoProps = ComponentProps<typeof DiffChangeUndo>;
export type DiffChangeKeepProps = ComponentProps<typeof DiffChangeKeep>;
export type DiffChangeOutcomeProps = ComponentProps<typeof DiffChangeOutcome>;
export type DiffChangeErrorProps = ComponentProps<typeof DiffChangeError>;
export type DiffLineProps = ComponentProps<typeof DiffLine>;
export type DiffCodeProps = ComponentProps<typeof DiffCode>;
export type DiffCollapsedProps = ComponentProps<typeof DiffCollapsed>;
export type DiffCollapsedTextProps = ComponentProps<typeof DiffCollapsedText>;
export type DiffShowAllProps = ComponentProps<typeof DiffShowAll>;
