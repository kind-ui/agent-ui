import { jobProgressPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@ui-sdk/solid/progress";
import { omit } from "solid-js";

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
  children?: JSX.Element;
};

/**
 * A long job: its status, title and time, a progress bar of its stage, its log as `children`, and Cancel or Retry
 * while `onCancel` or `onRetry` is set. To arrange the parts yourself, use `JobProgressRoot`.
 */
export function JobProgress(props: JobProgressProps) {
  return (
    <parts.Root {...omit(props, "children")}>
      <JobProgressTrigger>
        <JobProgressIcon />
        <JobProgressTitle />
        <JobProgressMeta />
      </JobProgressTrigger>
      <JobProgressProgress />
      <JobProgressContent>
        <JobProgressChildren>{props.children}</JobProgressChildren>
      </JobProgressContent>
      <JobProgressCancel />
      <JobProgressRetry />
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
export function JobProgressTitle(props: JobProgressTitleProps) {
  return <parts.Title {...omit(props, "children")}>{props.children ?? ((state) => state.title)}</parts.Title>;
}

export type JobProgressMetaProps = ComponentProps<typeof parts.Meta>;

/** The time elapsed and left, like "2 min elapsed, about 1 min left", unless you pass children. */
export function JobProgressMeta(props: JobProgressMetaProps) {
  return <parts.Meta {...omit(props, "children")}>{props.children ?? ((state) => state.label)}</parts.Meta>;
}

export type JobProgressProgressProps = ComponentProps<typeof parts.Progress>;

/**
 * A UI SDK Progress of the `value`, labelled by the stage, unless you pass children. Indeterminate without one. Its
 * track carries `data-agent-hidden`, which keeps the Progress out of the agent snapshot.
 */
export function JobProgressProgress(props: JobProgressProgressProps) {
  return (
    <parts.Progress {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <Progress value={state.value}>
            <ProgressLabel>
              <JobProgressStage />
            </ProgressLabel>
            <ProgressValue />
            <ProgressTrack data-agent-hidden="">
              <ProgressIndicator />
            </ProgressTrack>
          </Progress>
        ))}
    </parts.Progress>
  );
}

export type JobProgressStageProps = ComponentProps<typeof parts.Stage>;

/** The stage, like "3 of 7: Installing dependencies", else the title for assistive technology alone. */
export function JobProgressStage(props: JobProgressStageProps) {
  return <parts.Stage {...omit(props, "children")}>{props.children ?? ((state) => state.text)}</parts.Stage>;
}

export type JobProgressCancelProps = ComponentProps<typeof parts.Cancel>;

/** Calls `onCancel`. Reads "Cancel" unless you pass children. Rendered only while the job can be cancelled. */
export function JobProgressCancel(props: JobProgressCancelProps) {
  return (
    <parts.Cancel {...omit(props, "children")}>
      {props.children ?? (
        <>
          <span data-kind-pending-mark="" data-status-mark="" data-status="running" aria-hidden="true" />
          Cancel
        </>
      )}
    </parts.Cancel>
  );
}

export type JobProgressRetryProps = ComponentProps<typeof parts.Retry>;

/** Calls `onRetry`. Reads "Retry" unless you pass children. Rendered only while a failed job can be retried. */
export function JobProgressRetry(props: JobProgressRetryProps) {
  return (
    <parts.Retry {...omit(props, "children")}>
      {props.children ?? (
        <>
          <span data-kind-pending-mark="" data-status-mark="" data-status="running" aria-hidden="true" />
          Retry
        </>
      )}
    </parts.Retry>
  );
}
