"use client";

import { jobProgressPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/react/primitive";
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@ui-sdk/react/progress";
import type { ComponentProps, ReactNode } from "react";

const parts = createParts(jobProgressPrimitive, {
  root: "div",
  trigger: "button",
  icon: "span",
  title: "span",
  meta: "span",
  progress: "div",
  stage: "span",
  content: "div",
  children: "div",
  cancel: "button",
  retry: "button",
});

export type JobProgressProps = Omit<ComponentProps<typeof parts.Root>, "children"> & {
  /** The job's log, like a `Terminal`, shown when the job is open. */
  children?: ReactNode;
};

/**
 * A long job: its status, title and time, a progress bar of its stage, its log as `children`, and Cancel or Retry
 * while `onCancel` or `onRetry` is set. To arrange the parts yourself, use `JobProgressRoot`.
 */
export function JobProgress({ children, ...props }: JobProgressProps) {
  return (
    <parts.Root {...props}>
      {DEFAULT_START}
      <JobProgressContent>
        <JobProgressChildren>{children}</JobProgressChildren>
      </JobProgressContent>
      {DEFAULT_END}
    </parts.Root>
  );
}

/** The bare root, for arranging the parts yourself. */
export const JobProgressRoot = parts.Root;
export const JobProgressTrigger = parts.Trigger;
export const JobProgressIcon = parts.Icon;
export const JobProgressContent = parts.Content;
export const JobProgressChildren = parts.Children;

export type JobProgressTitleProps = ComponentProps<typeof parts.Title>;

/** The `label`, else "Job", unless you pass children. */
export function JobProgressTitle({ children = ({ title }) => title, ...props }: JobProgressTitleProps) {
  return <parts.Title {...props}>{children}</parts.Title>;
}

export type JobProgressMetaProps = ComponentProps<typeof parts.Meta>;

/** The time elapsed and left, like "2 min elapsed, about 1 min left", unless you pass children. */
export function JobProgressMeta({ children = ({ label }) => label, ...props }: JobProgressMetaProps) {
  return <parts.Meta {...props}>{children}</parts.Meta>;
}

export type JobProgressProgressProps = ComponentProps<typeof parts.Progress>;

/**
 * A UI SDK Progress of the `value`, labelled by the stage, unless you pass children. Indeterminate without one. Its
 * track carries `data-agent-hidden`, which keeps the Progress out of the agent snapshot.
 */
export function JobProgressProgress({
  children = ({ value }) => (
    <Progress value={value}>
      <ProgressLabel>
        <JobProgressStage />
      </ProgressLabel>
      <ProgressValue />
      <ProgressTrack data-agent-hidden="">
        <ProgressIndicator />
      </ProgressTrack>
    </Progress>
  ),
  ...props
}: JobProgressProgressProps) {
  return <parts.Progress {...props}>{children}</parts.Progress>;
}

export type JobProgressStageProps = ComponentProps<typeof parts.Stage>;

/** The stage, like "3 of 7: Installing dependencies", else the title for assistive technology alone. */
export function JobProgressStage({ children = ({ text }) => text, ...props }: JobProgressStageProps) {
  return <parts.Stage {...props}>{children}</parts.Stage>;
}

export type JobProgressCancelProps = ComponentProps<typeof parts.Cancel>;

/** Calls `onCancel`. Reads "Cancel" unless you pass children. Rendered only while the job can be cancelled. */
export function JobProgressCancel({ children = CANCEL, ...props }: JobProgressCancelProps) {
  return <parts.Cancel {...props}>{children}</parts.Cancel>;
}

export type JobProgressRetryProps = ComponentProps<typeof parts.Retry>;

/** Calls `onRetry`. Reads "Retry" unless you pass children. Rendered only while a failed job can be retried. */
export function JobProgressRetry({ children = RETRY, ...props }: JobProgressRetryProps) {
  return <parts.Retry {...props}>{children}</parts.Retry>;
}

const PENDING_MARK = (
  <span data-kind-pending-mark="" data-status-mark="" data-status="running" aria-hidden="true" />
);

const CANCEL = (
  <>
    {PENDING_MARK}
    Cancel
  </>
);

const RETRY = (
  <>
    {PENDING_MARK}
    Retry
  </>
);

// Shared, so an update doesn't render the default parts' wrappers again.
const DEFAULT_START = (
  <>
    <JobProgressTrigger>
      <JobProgressIcon />
      <JobProgressTitle />
      <JobProgressMeta />
    </JobProgressTrigger>
    <JobProgressProgress />
  </>
);

const DEFAULT_END = (
  <>
    <JobProgressCancel />
    <JobProgressRetry />
  </>
);
