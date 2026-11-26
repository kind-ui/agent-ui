import { jobProgressPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@ui-sdk/vue/progress";
import { type Component, defineComponent, h, type Slot, type VNodeChild } from "vue";

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

// A part whose default slot falls back to `fallback`, as React's default `children` do.
const withDefault = <State, Part extends Component = Component>(
  part: Part,
  name: string,
  fallback: (scope: { state: State }) => VNodeChild,
): Part =>
  defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () => h(part as Component, attrs, { ...slots, default: slots.default ?? (fallback as Slot) });
    },
  }) as unknown as Part;

/** The bare root, for arranging the parts yourself. */
export const JobProgressRoot = parts.Root;
export const JobProgressTrigger = parts.Trigger;
export const JobProgressIcon = parts.Icon;
export const JobProgressContent = parts.Content;
export const JobProgressChildren = parts.Children;

/** The `label`, else "Job", unless you fill the slot. */
export const JobProgressTitle = withDefault<{ title: string }>(
  parts.Title,
  "JobProgressTitle",
  ({ state }) => state.title,
);

/** The time elapsed and left, like "2 min elapsed, about 1 min left", unless you fill the slot. */
export const JobProgressMeta = withDefault<{ label: string }>(
  parts.Meta,
  "JobProgressMeta",
  ({ state }) => state.label,
);

/** The stage, like "3 of 7: Installing dependencies", else the title for assistive technology alone. */
export const JobProgressStage = withDefault<{ text: string }>(
  parts.Stage,
  "JobProgressStage",
  ({ state }) => state.text,
);

/**
 * A UI SDK Progress of the `value`, labelled by the stage, unless you fill the slot. Indeterminate without one. Its
 * track carries `data-agent-hidden`, which keeps the Progress out of the agent snapshot.
 */
export const JobProgressProgress = withDefault<{ value: number | null }>(
  parts.Progress,
  "JobProgressProgress",
  ({ state }) =>
    h(Progress, { value: state.value }, () => [
      h(ProgressLabel, null, () => h(JobProgressStage)),
      h(ProgressValue),
      h(ProgressTrack, { "data-agent-hidden": "" }, () => h(ProgressIndicator)),
    ]),
);

const pendingMark = () =>
  h("span", {
    "data-kind-pending-mark": "",
    "data-status-mark": "",
    "data-status": "running",
    "aria-hidden": "true",
  });

/** Calls `onCancel`. Reads "Cancel" unless you fill the slot. Rendered only while the job can be cancelled. */
export const JobProgressCancel = withDefault(parts.Cancel, "JobProgressCancel", () => [
  pendingMark(),
  "Cancel",
]);

/** Calls `onRetry`. Reads "Retry" unless you fill the slot. Rendered only while a failed job can be retried. */
export const JobProgressRetry = withDefault(parts.Retry, "JobProgressRetry", () => [pendingMark(), "Retry"]);

/**
 * A long job: its status, title and time, a progress bar of its stage, its log in the default slot, and Cancel or
 * Retry while `onCancel` or `onRetry` is set. To arrange the parts yourself, use `JobProgressRoot`.
 */
export const JobProgress = defineComponent({
  name: "JobProgress",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Root, attrs, {
        ...slots,
        default: () => [
          h(JobProgressTrigger, null, () => [h(JobProgressIcon), h(JobProgressTitle), h(JobProgressMeta)]),
          h(JobProgressProgress),
          h(JobProgressContent, null, () => h(JobProgressChildren, null, () => slots.default?.())),
          h(JobProgressCancel),
          h(JobProgressRetry),
        ],
      });
  },
}) as unknown as typeof parts.Root;
