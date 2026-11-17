"use client";

import { Switch, SwitchThumb } from "@ui-sdk/react/switch";
import { withKindClass } from "./kind-class.js";

export const KindSwitch = withKindClass(
  Switch,
  "inline-flex h-[18px] w-8 shrink-0 cursor-pointer items-center rounded-full bg-[var(--kind-color-border)] p-0.5 outline-none transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--kind-color-ring)] motion-reduce:transition-none data-checked:bg-[var(--kind-color-accent)] data-disabled:cursor-not-allowed data-disabled:opacity-50",
  "KindSwitch",
);
export const KindSwitchThumb = withKindClass(
  SwitchThumb,
  "block size-3.5 rounded-full bg-[var(--kind-color-surface)] shadow-sm shadow-[color:var(--kind-color-shadow)]/10 transition-transform duration-[120ms] motion-reduce:transition-none data-checked:translate-x-3.5 rtl:data-checked:-translate-x-3.5",
  "KindSwitchThumb",
);
