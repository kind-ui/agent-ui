import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@ui-sdk/svelte/progress";
import { withKindClass } from "../kind-class.js";

export const KindProgress = withKindClass(
  Progress,
  "flex flex-col gap-1 text-[length:var(--kind-text-md)]/5",
);
export const KindProgressLabel = withKindClass(ProgressLabel, "font-medium text-[var(--kind-color-fg)]");
export const KindProgressValue = withKindClass(ProgressValue, "tabular-nums text-[var(--kind-color-muted)]");
export const KindProgressTrack = withKindClass(
  ProgressTrack,
  "h-1.5 w-full overflow-hidden rounded-full bg-[var(--kind-color-border)]",
);
export const KindProgressIndicator = withKindClass(
  ProgressIndicator,
  "h-full bg-[var(--kind-color-fg)] data-indeterminate:w-1/3",
);
