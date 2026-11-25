import type { ComponentProps } from "svelte";
import JobProgress from "./JobProgress.svelte";
import JobProgressCancel from "./JobProgressCancel.svelte";
import JobProgressMeta from "./JobProgressMeta.svelte";
import JobProgressProgress from "./JobProgressProgress.svelte";
import JobProgressRetry from "./JobProgressRetry.svelte";
import JobProgressStage from "./JobProgressStage.svelte";
import JobProgressTitle from "./JobProgressTitle.svelte";
import { parts } from "./parts.js";

export {
  JobProgress,
  JobProgressCancel,
  JobProgressMeta,
  JobProgressProgress,
  JobProgressRetry,
  JobProgressStage,
  JobProgressTitle,
};
/** The bare root, for arranging the parts yourself. */
export const JobProgressRoot = parts.Root;
export const JobProgressTrigger = parts.Trigger;
export const JobProgressIcon = parts.Icon;
export const JobProgressContent = parts.Content;
export const JobProgressChildren = parts.Children;

export type JobProgressProps = ComponentProps<typeof JobProgress>;
export type JobProgressTitleProps = ComponentProps<typeof JobProgressTitle>;
export type JobProgressMetaProps = ComponentProps<typeof JobProgressMeta>;
export type JobProgressProgressProps = ComponentProps<typeof JobProgressProgress>;
export type JobProgressStageProps = ComponentProps<typeof JobProgressStage>;
export type JobProgressCancelProps = ComponentProps<typeof JobProgressCancel>;
export type JobProgressRetryProps = ComponentProps<typeof JobProgressRetry>;
