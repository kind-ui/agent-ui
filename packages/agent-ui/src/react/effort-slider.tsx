"use client";

import {
  EFFORT_SLIDER_THUMB,
  type EffortSliderModelState,
  type EffortSliderStop,
  type EffortSliderTriggerState,
  effortSliderPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, renderElement } from "@ui-sdk/react/primitive";
import type { ComponentProps, CSSProperties, ReactNode } from "react";
import {
  KindSlider,
  KindSliderControl,
  KindSliderIndicator,
  KindSliderThumb,
  KindSliderTrack,
  KindSliderValue,
} from "./internal/slider.js";

const parts = createParts(effortSliderPrimitive, {
  root: "div",
  trigger: "button",
  content: "div",
  viewport: "div",
  title: "h2",
  slider: "div",
  stops: "div",
  reset: "button",
  model: "p",
});

export type EffortSliderProps = ComponentProps<typeof parts.Root>;
export type EffortSliderTriggerProps = ComponentProps<typeof parts.Trigger>;
export type EffortSliderContentProps = ComponentProps<typeof parts.Content>;
export type EffortSliderTitleProps = ComponentProps<typeof parts.Title>;
export type EffortSliderSliderProps = ComponentProps<typeof parts.Slider>;
export type EffortSliderStopsProps = ComponentProps<typeof parts.Stops>;
export type EffortSliderResetProps = ComponentProps<typeof parts.Reset>;
export type EffortSliderModelProps = ComponentProps<typeof parts.Model>;

const triggerContent = ({ levels, index }: EffortSliderTriggerState) => (
  <>
    <span data-effort-slider-glyph="" />
    {/* Every label shares one cell and only the chosen one shows, so the trigger keeps its width. */}
    <span data-effort-slider-value="">
      {levels.map((level, at) => (
        <span key={level.value} data-current={at === index ? "" : undefined}>
          {level.label}
        </span>
      ))}
    </span>
    <span data-effort-slider-chevron="" />
  </>
);

/** Opens the popup. Shows the chosen level's label beside a bolt that grows with it, unless you pass children. */
export function EffortSliderTrigger({ children = triggerContent, ...props }: EffortSliderTriggerProps) {
  return <parts.Trigger {...props}>{children}</parts.Trigger>;
}

/** The popup above the button: the level, the model, Reset and the slider, unless you pass children. Focus moves to the thumb. */
export function EffortSliderContent({
  children = DEFAULT_PANEL,
  render,
  ...props
}: EffortSliderContentProps) {
  return (
    <parts.Content
      initialFocus={EFFORT_SLIDER_THUMB}
      side="top"
      sideOffset={8}
      {...props}
      // A sheet sits in a full-screen viewport, which renders only while the content presents as one.
      render={(content, state) => {
        const element = renderElement("div", content, render, state);
        return state.presentation === "sheet" ? <parts.Viewport>{element}</parts.Viewport> : element;
      }}
    >
      {children}
    </parts.Content>
  );
}

/** Names the popup: the `label`, unless you pass children. The styles keep it for assistive technology only. */
export function EffortSliderTitle({ children = ({ label }) => label, ...props }: EffortSliderTitleProps) {
  return <parts.Title {...props}>{children}</parts.Title>;
}

/**
 * UI SDK Slider, a step per level: the level the thumb is on, the model and Reset above a track holding a dot per
 * level.
 */
export function EffortSliderSlider({
  children,
  ...props
}: Omit<EffortSliderSliderProps, "children"> & {
  /** What sits above the track: the glyph, the title, the level, the model and Reset by default. */
  children?: ReactNode;
}) {
  return (
    <parts.Slider {...props}>
      {(state) => (
        <KindSlider {...state.props}>
          <div data-effort-slider-header="">
            {children ?? (
              <>
                <span data-effort-slider-glyph="" />
                <div data-effort-slider-heading="">
                  <EffortSliderTitle />
                  <KindSliderValue />
                  <EffortSliderModel />
                </div>
                <EffortSliderReset />
              </>
            )}
          </div>
          <KindSliderControl>
            <KindSliderTrack>
              <EffortSliderStops />
              <KindSliderIndicator />
              <KindSliderThumb aria-label={state.thumbLabel} />
            </KindSliderTrack>
          </KindSliderControl>
        </KindSlider>
      )}
    </parts.Slider>
  );
}

const stopsContent = ({ stops }: { stops: EffortSliderStop[] }) =>
  stops.map((stop) => (
    <span
      key={stop.value}
      data-effort-slider-stop=""
      data-current={stop.current ? "" : undefined}
      data-top={stop.top ? "" : undefined}
      style={{ "--kind-effort-slider-stop": stop.position } as CSSProperties}
    />
  ));

/** A dot on the track for each level, hidden from assistive technology, which hears the thumb's level. */
export function EffortSliderStops({ children = stopsContent, ...props }: EffortSliderStopsProps) {
  return <parts.Stops {...props}>{children}</parts.Stops>;
}

/** Returns to the `defaultLevel`, drawn as an icon. Present only while another level is chosen. */
export function EffortSliderReset({
  children = <span data-effort-slider-reset-text="">Reset</span>,
  ...props
}: EffortSliderResetProps) {
  return <parts.Reset {...props}>{children}</parts.Reset>;
}

const modelContent = ({ text, href, pressable }: EffortSliderModelState) =>
  href ? <a href={href}>{text}</a> : pressable ? <button type="button">{text}</button> : text;

/** The model, under the level: a link with `modelHref`, a button with `onModelPress`, else text. Present only with a `modelLabel`. */
export function EffortSliderModel({ children = modelContent, ...props }: EffortSliderModelProps) {
  return <parts.Model {...props}>{children}</parts.Model>;
}

// Shared, so an update doesn't render the default parts' wrappers again.
const DEFAULT_PANEL = <EffortSliderSlider />;
const DEFAULT_PARTS = (
  <>
    <EffortSliderTrigger />
    <EffortSliderContent />
  </>
);

/**
 * A button that shows the chosen effort level and opens a popover holding a slider with a stop per level. Any
 * `children` replace the trigger and the popup.
 */
export function EffortSlider({ children = DEFAULT_PARTS, ...props }: EffortSliderProps) {
  return <parts.Root {...props}>{children}</parts.Root>;
}
