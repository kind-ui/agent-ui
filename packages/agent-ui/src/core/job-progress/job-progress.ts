import { createFocusRecovery, definePrimitive, type SlotDefinition } from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { StepStatus } from "../../types/index.js";
import { createPendingAction } from "../pending.js";
import { holdTransitions, type StepApi, type StepOptions, type StepState, stepBase } from "../step/base.js";
import { durationLabel } from "../time.js";

export type JobProgressOptions = StepOptions & {
  /** How much of the job is done, from 0 to 1. Without it, the bar is indeterminate. */
  value?: number;
  /** What the job is doing now, like "Installing dependencies". */
  stage?: string;
  /** The current stage's index, from 0, read with `stageCount` as "3 of 7". */
  stageIndex?: number;
  /** How many stages the job has. */
  stageCount?: number;
  /** When the job started, as an ISO 8601 instant. The meta counts the time since while the job runs. */
  startedAt?: string;
  /** About how many seconds the job has left. */
  etaSeconds?: number;
  /**
   * The current time, as an ISO 8601 instant, for the time elapsed. Without it, the elapsed time ticks in the
   * browser once the root binds, and server markup leaves it out.
   */
  now?: string;
  /**
   * Called when the job is cancelled. Shows Cancel while set and the job hasn't finished. Return a promise to keep
   * it pending until it settles: a rejection makes it available again.
   */
  onCancel?: () => unknown;
  /**
   * Called when a failed job is retried. Shows Retry while set and the status is `error`. Return a promise to keep
   * it pending until it settles: a rejection makes it available again.
   */
  onRetry?: () => unknown;
};

export type JobProgressState = StepState & {
  /** The `label`, else "Job". */
  title: string;
  /** The `value` as a percent from 0 to 100, 100 once complete, else `null` for an indeterminate bar. */
  percent: number | null;
  /** The stage in words, like "3 of 7: Installing dependencies", or empty. */
  stage: string;
  /** The `startedAt` option. */
  startedAt: string | undefined;
  /** The `etaSeconds` option. */
  etaSeconds: number | undefined;
  /** Whole seconds since `startedAt`, or `null` without one, and before the root binds without `now`. */
  elapsed: number | null;
  /** Whether `onCancel` is set. */
  canCancel: boolean;
  /** Whether `onRetry` is set. */
  canRetry: boolean;
  /** Whether a promise `onCancel` or `onRetry` returned is still pending. */
  pending: boolean;
};

export type JobProgressApi = StepApi & {
  /** Calls `onCancel`. Offered only while it's set, the job hasn't finished, and nothing is pending. */
  readonly cancel: (() => void) | undefined;
  /** Calls `onRetry`. Offered only while it's set, the job failed, and nothing is pending. */
  readonly retry: (() => void) | undefined;
  /** Moves focus to the trigger when Cancel or Retry leaves while focused. Called by their slots. */
  actionRecovery: ReturnType<typeof createFocusRecovery>;
  /** Starts the elapsed clock without `now`, from the root's `bind`. Returns the cleanup. */
  bindClock: () => () => void;
};

type Slot<Public extends object = Record<never, never>> = SlotDefinition<
  JobProgressState,
  JobProgressApi,
  BaseSlotProps,
  Public
>;

type JobProgressSlots = {
  root: Slot;
  trigger: Slot;
  icon: Slot;
  title: Slot<{ title: string }>;
  meta: Slot<{ label: string }>;
  content: Slot;
  children: Slot;
  progress: Slot<{ value: number | null }>;
  stage: Slot<{ text: string }>;
  cancel: Slot<{ pending: boolean }>;
  retry: Slot<{ pending: boolean }>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type JobProgressPrimitive = ReturnType<
  typeof definePrimitive<JobProgressOptions, JobProgressState, JobProgressApi, JobProgressSlots>
>;

const ACTIVE = new Set<StepStatus>(["pending", "running", "awaiting-input"]);
const FINISHED = new Set<StepStatus>(["complete", "error", "cancelled"]);

/** The stage in words: "3 of 7: Installing dependencies", "3 of 7", "Installing dependencies", or empty. */
export const jobStage = (stage?: string, stageIndex?: number, stageCount?: number): string => {
  const count =
    stageIndex !== undefined && stageCount !== undefined && stageCount >= 1
      ? `${Math.min(Math.max(Math.round(stageIndex), 0) + 1, stageCount)} of ${stageCount}`
      : "";
  return [count, stage?.trim()].filter(Boolean).join(": ");
};

/**
 * The meta's words: "2 min elapsed, about 1 min left" while the job runs, how long it took (`durationSeconds`) once
 * it finished, else empty.
 */
export const jobProgressMeta = (
  status: StepStatus,
  {
    elapsed,
    etaSeconds,
    durationSeconds,
  }: { elapsed?: number | null; etaSeconds?: number | undefined; durationSeconds?: number | undefined },
): string => {
  if (FINISHED.has(status)) return durationLabel(durationSeconds);
  // A web `status` attribute can hold any string.
  if (!ACTIVE.has(status)) return "";
  const words: string[] = [];
  if (elapsed != null) words.push(`${durationLabel(elapsed)} elapsed`);
  if (etaSeconds !== undefined && etaSeconds > 0 && Number.isFinite(etaSeconds)) {
    words.push(`about ${durationLabel(etaSeconds)} left`);
  }
  return words.join(", ");
};

const percentOf = (status: StepStatus, value: number | undefined) => {
  if (status === "complete") return 100;
  if (value === undefined || !Number.isFinite(value)) return null;
  return Math.round(Math.min(Math.max(value, 0), 1) * 1000) / 10;
};

const secondsSince = (startedAt: string | undefined, now: number) => {
  const start = startedAt ? Date.parse(startedAt) : Number.NaN;
  return Number.isNaN(start) || Number.isNaN(now) ? null : Math.max(0, Math.floor((now - start) / 1000));
};

const base = stepBase<JobProgressState, JobProgressApi, JobProgressOptions>({ kind: "job" });

const presentation = (options: JobProgressOptions) => ({
  title: options.label ?? "Job",
  percent: percentOf(options.status ?? "pending", options.value),
  stage: jobStage(options.stage, options.stageIndex, options.stageCount),
  startedAt: options.startedAt,
  etaSeconds: options.etaSeconds,
  canCancel: options.onCancel !== undefined,
  canRetry: options.onRetry !== undefined,
});

const cancellable = (state: JobProgressState) => state.canCancel && ACTIVE.has(state.status);
const retryable = (state: JobProgressState) => state.canRetry && state.status === "error";

export const jobProgressPrimitive: JobProgressPrimitive = definePrimitive<
  JobProgressOptions,
  JobProgressState,
  JobProgressApi,
  JobProgressSlots
>({
  name: "kind-job-progress",
  ...base,
  options: {
    ...base.options,
    value: "number",
    stage: "string",
    stageIndex: "number",
    stageCount: "number",
    startedAt: "string",
    etaSeconds: "number",
    now: "string",
    onCancel: "action",
    onRetry: "action",
  },
  state: (options) => ({
    ...base.state(options),
    ...presentation(options),
    elapsed: options.now ? secondsSince(options.startedAt, Date.parse(options.now)) : null,
    pending: false,
  }),
  sync: (options) => ({ ...base.sync(options), ...presentation(options) }),
  live: ["elapsed"],
  api: (context) => {
    const { store } = context;
    const pendingAction = createPendingAction(context, { state: "pending" });
    let status = store.get().status;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let bound = false;

    // Without `now`, wakes on each whole second after `startedAt` while the job runs.
    const tick = () => {
      clearTimeout(timer);
      const { now, startedAt, status } = context.options();
      const time = now ? Date.parse(now) : bound ? Date.now() : Number.NaN;
      const elapsed = secondsSince(startedAt, time);
      if (elapsed !== store.get().elapsed) store.set({ elapsed });
      if (now || !bound || elapsed === null || !ACTIVE.has(status ?? "pending")) return;
      const start = Date.parse(startedAt ?? "");
      timer = setTimeout(tick, 1000 - ((Date.now() - start) % 1000));
    };

    context.onOptions((options) => {
      tick();
      const next = options.status ?? "pending";
      if (next === status) return;
      status = next;
      // A new status answers the request, so a late result doesn't unlock the next one.
      pendingAction.release();
    });
    context.onDestroy(() => clearTimeout(timer));

    const run = (key: "onCancel" | "onRetry") => () => {
      const call = context.options()[key];
      if (call) pendingAction.run(call);
    };
    const cancel = run("onCancel");
    const retry = run("onRetry");
    return {
      ...base.api(context),
      actionRecovery: createFocusRecovery({ fallback: () => context.element("trigger") }),
      bindClock: () => {
        bound = true;
        tick();
        return () => {
          bound = false;
          clearTimeout(timer);
        };
      },
      get cancel() {
        const state = store.get();
        return cancellable(state) && !state.pending ? cancel : undefined;
      },
      get retry() {
        const state = store.get();
        return retryable(state) && !state.pending ? retry : undefined;
      },
    };
  },
  slots: (slot) => {
    const { root, title, meta, ...slots } = base.slots(slot);
    const action = (key: "cancel" | "retry", present: (state: JobProgressState) => boolean) =>
      slot<BaseSlotProps, { pending: boolean }>({
        role: "button",
        focus: "native",
        present,
        press: ({ api }) => api[key]?.(),
        state: (state) => ({ pending: state.pending }),
        attrs: (state) => ({
          type: "button",
          "data-kind-button": "secondary",
          "aria-disabled": state.pending ? "true" : undefined,
          "data-step-part": key,
          "data-pending": state.pending ? "" : undefined,
        }),
        bind: (el, part) => part.api.actionRecovery.bind(el, part),
      });
    return {
      ...slots,
      root: slot({
        ...root,
        attrs: (state, part) => ({
          ...root.attrs?.(state, part),
          "aria-busy": state.pending ? "true" : undefined,
        }),
        bind: (el, { api }) => {
          const release = holdTransitions(el);
          const stop = api.bindClock();
          return () => {
            stop();
            release();
          };
        },
      }),
      title: slot<BaseSlotProps, { title: string }>({ ...title, state: (state) => ({ title: state.title }) }),
      meta: slot<BaseSlotProps, { label: string }>({
        ...meta,
        state: (state) => ({ label: jobProgressMeta(state.status, state) }),
      }),
      // Outside the content, so it shows while closed.
      progress: slot<BaseSlotProps, { value: number | null }>({
        state: (state) => ({ value: state.percent }),
        attrs: (state) => ({ "data-step-part": "progress", "data-motion": state.motion }),
      }),
      // The Progress's label: the stage, else the title, which only assistive technology then reads.
      stage: slot<BaseSlotProps, { text: string }>({
        state: (state) => ({ text: state.stage || state.title }),
        attrs: (state) => ({ "data-step-part": "stage", "data-fallback": state.stage ? undefined : "" }),
      }),
      cancel: action("cancel", cancellable),
      retry: action("retry", retryable),
    };
  },
  agent: { actions: ["expand", "collapse", "cancel", "retry"] },
});
