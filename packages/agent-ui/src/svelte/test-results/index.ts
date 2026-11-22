import type { ComponentProps } from "svelte";
import { parts } from "./parts.js";
import TestResults from "./TestResults.svelte";
import TestResultsCount from "./TestResultsCount.svelte";
import TestResultsEmpty from "./TestResultsEmpty.svelte";
import TestResultsFailure from "./TestResultsFailure.svelte";
import TestResultsFilter from "./TestResultsFilter.svelte";
import TestResultsItem from "./TestResultsItem.svelte";
import TestResultsMeta from "./TestResultsMeta.svelte";
import TestResultsRows from "./TestResultsRows.svelte";
import TestResultsTitle from "./TestResultsTitle.svelte";
import TestResultsTree from "./TestResultsTree.svelte";

export const TestResultsTrigger = parts.Trigger;
export const TestResultsIcon = parts.Icon;
export const TestResultsContent = parts.Content;
/** A row's status mark, read as its status and duration, like "failed, 12 ms". */
export const TestResultsItemStatus = parts.ItemStatus;

export {
  TestResults,
  TestResultsCount,
  TestResultsEmpty,
  TestResultsFailure,
  TestResultsFilter,
  TestResultsItem,
  TestResultsMeta,
  TestResultsRows,
  TestResultsTitle,
  TestResultsTree,
};

export type TestResultsProps = ComponentProps<typeof TestResults>;
export type TestResultsTitleProps = ComponentProps<typeof TestResultsTitle>;
export type TestResultsMetaProps = ComponentProps<typeof TestResultsMeta>;
export type TestResultsFilterProps = ComponentProps<typeof TestResultsFilter>;
export type TestResultsCountProps = ComponentProps<typeof TestResultsCount>;
export type TestResultsTreeProps = ComponentProps<typeof TestResultsTree>;
export type TestResultsRowsProps = ComponentProps<typeof TestResultsRows>;
export type TestResultsItemProps = ComponentProps<typeof TestResultsItem>;
export type TestResultsItemStatusProps = ComponentProps<typeof parts.ItemStatus>;
export type TestResultsFailureProps = ComponentProps<typeof TestResultsFailure>;
export type TestResultsEmptyProps = ComponentProps<typeof TestResultsEmpty>;
