import type { StepStatus } from "../../types/index.js";
import { nextOpen, type StepAutoOpen } from "../step/auto-open.js";

/** One step the agent took. Keep its `id` as its status changes. */
export type ChainOfThoughtStep = {
  /** Keys the step's item (its `value`), open state and focus. Unique within the chain. */
  id: string;
  /** What the step is doing. Its icon shows it, and a change into `awaiting-input`, `complete`, `error` or `cancelled` is announced. */
  status: StepStatus;
  /** Names the step, in its item and in announcements. An empty title isn't announced. */
  title: string;
  /** Shown beside the title, and written as `--kind-step-duration`. */
  durationSeconds?: number;
};

export interface NextOpenStepsInput {
  prev: ChainOfThoughtStep[];
  next: ChainOfThoughtStep[];
  open: string[];
  /** Steps a person or agent toggled, which auto open and close leave alone. */
  toggled: string[];
  autoOpen: StepAutoOpen;
}

/** Each step opens and closes as a Step does (`nextOpen`), a new step counting as coming from `pending`. */
export function nextOpenSteps({ prev, next, open, toggled, autoOpen }: NextOpenStepsInput): string[] {
  const statuses = new Map(prev.map((step) => [step.id, step.status]));
  return next
    .filter(({ id, status }) =>
      nextOpen({
        status,
        prevStatus: statuses.get(id) ?? "pending",
        open: open.includes(id),
        userToggled: toggled.includes(id),
        autoOpen,
      }),
    )
    .map((step) => step.id);
}

/** A step's duration as "N s", rounded and at least 1, or empty while unknown. */
export const stepDuration = (seconds: number | undefined): string =>
  seconds === undefined || !Number.isFinite(seconds) ? "" : `${Math.max(1, Math.round(seconds))} s`;
