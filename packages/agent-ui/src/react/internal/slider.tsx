"use client";

import {
  Slider,
  SliderControl,
  SliderIndicator,
  SliderThumb,
  SliderTrack,
  SliderValue,
} from "@ui-sdk/react/slider";
import { withKindClass } from "./kind-class.js";

export const KindSlider = withKindClass(
  Slider,
  "flex w-full flex-col gap-1.5 data-disabled:opacity-50",
  "KindSlider",
);
export const KindSliderControl = withKindClass(
  SliderControl,
  "flex h-5 w-full touch-none select-none items-center data-disabled:cursor-not-allowed",
  "KindSliderControl",
);
export const KindSliderTrack = withKindClass(
  SliderTrack,
  "h-1 w-full rounded-full bg-[var(--kind-color-hover)]",
  "KindSliderTrack",
);
export const KindSliderIndicator = withKindClass(
  SliderIndicator,
  "rounded-full bg-[var(--kind-color-accent)]",
  "KindSliderIndicator",
);
export const KindSliderThumb = withKindClass(
  SliderThumb,
  "size-4 rounded-full border border-[var(--kind-color-border)] bg-[var(--kind-color-surface)] shadow-sm shadow-[color:var(--kind-color-shadow)]/10 has-[:focus-visible]:[outline:var(--kind-focus-ring)] has-[:focus-visible]:[outline-offset:var(--kind-focus-offset)]",
  "KindSliderThumb",
);
export const KindSliderValue = withKindClass(
  SliderValue,
  "text-[length:var(--kind-text-xs)]/4 tabular-nums text-[var(--kind-color-muted)]",
  "KindSliderValue",
);
