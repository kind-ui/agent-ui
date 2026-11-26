import type { ComponentProps } from "svelte";
import Diff from "./Diff.svelte";
import DiffAccept from "./DiffAccept.svelte";
import DiffCode from "./DiffCode.svelte";
import DiffCollapsed from "./DiffCollapsed.svelte";
import DiffCollapsedText from "./DiffCollapsedText.svelte";
import DiffNewNumber from "./DiffNewNumber.svelte";
import DiffOldNumber from "./DiffOldNumber.svelte";
import DiffPath from "./DiffPath.svelte";
import DiffRevert from "./DiffRevert.svelte";
import DiffRow from "./DiffRow.svelte";
import DiffSign from "./DiffSign.svelte";
import DiffStats from "./DiffStats.svelte";
import DiffStatus from "./DiffStatus.svelte";
import DiffTable from "./DiffTable.svelte";
import { parts } from "./parts.js";

/** Holds the path, status, stats and actions. */
export const DiffHeader = parts.Header;
export const DiffCopy = parts.Copy;
/** Scrolls the lines. Holds a `DiffTable`. */
export const DiffViewport = parts.Viewport;

export {
  Diff,
  DiffAccept,
  DiffCode,
  DiffCollapsed,
  DiffCollapsedText,
  DiffNewNumber,
  DiffOldNumber,
  DiffPath,
  DiffRevert,
  DiffRow,
  DiffSign,
  DiffStats,
  DiffStatus,
  DiffTable,
};
export type DiffProps = ComponentProps<typeof Diff>;
export type DiffPathProps = ComponentProps<typeof DiffPath>;
export type DiffStatusProps = ComponentProps<typeof DiffStatus>;
export type DiffStatsProps = ComponentProps<typeof DiffStats>;
export type DiffAcceptProps = ComponentProps<typeof DiffAccept>;
export type DiffRevertProps = ComponentProps<typeof DiffRevert>;
export type DiffTableProps = ComponentProps<typeof DiffTable>;
export type DiffOldNumberProps = ComponentProps<typeof DiffOldNumber>;
export type DiffNewNumberProps = ComponentProps<typeof DiffNewNumber>;
export type DiffSignProps = ComponentProps<typeof DiffSign>;
export type DiffCodeProps = ComponentProps<typeof DiffCode>;
export type DiffCollapsedProps = ComponentProps<typeof DiffCollapsed>;
export type DiffCollapsedTextProps = ComponentProps<typeof DiffCollapsedText>;
export type DiffRowProps = ComponentProps<typeof DiffRow>;
