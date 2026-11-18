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
  "flex h-[var(--kind-slider-control-height,1.25rem)] w-full touch-none select-none items-center data-disabled:cursor-not-allowed",
  "KindSliderControl",
);
export const KindSliderTrack = withKindClass(
  SliderTrack,
  "h-[var(--kind-slider-track-height,0.25rem)] w-full rounded-[var(--kind-slider-track-radius,9999px)] bg-[var(--kind-slider-track-color,var(--kind-color-hover))]",
  "KindSliderTrack",
);
export const KindSliderIndicator = withKindClass(
  SliderIndicator,
  "rounded-full bg-[var(--kind-slider-indicator-color,var(--kind-color-accent))]",
  "KindSliderIndicator",
);
export const KindSliderThumb = withKindClass(
  SliderThumb,
  "size-[var(--kind-slider-thumb-size,1rem)] rounded-full border border-[var(--kind-slider-thumb-border,var(--kind-color-border))] bg-[var(--kind-slider-thumb-color,var(--kind-color-surface))] shadow-sm shadow-[color:var(--kind-color-shadow)]/10 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--kind-color-ring)]",
  "KindSliderThumb",
);
export const KindSliderValue = withKindClass(
  SliderValue,
  "text-[length:var(--kind-slider-value-font-size,0.75rem)] leading-[var(--kind-slider-value-line-height,1rem)] tabular-nums text-[var(--kind-slider-value-color,var(--kind-color-muted))]",
  "KindSliderValue",
);
