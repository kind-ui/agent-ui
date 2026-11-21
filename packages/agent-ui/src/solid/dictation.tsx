import {
  type DictationStatusState,
  type DictationWaveformState,
  dictationButtonPrimitive,
} from "@kind-ui/agent-ui/core";
import type { ComponentProps } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, omit } from "solid-js";

const parts = createParts(dictationButtonPrimitive, {
  root: "div",
  start: "button",
  waveform: "span",
  bar: "span",
  status: "span",
  "status-icon": "span",
  stop: "button",
  cancel: "button",
});

export type DictationProps = ComponentProps<typeof parts.Root>;
export type DictationWaveformProps = ComponentProps<typeof parts.Waveform>;
export type DictationStatusProps = ComponentProps<typeof parts.Status>;

/** The mic button, shown while idle or after an error. */
export const DictationStart = parts.Start;
/** Stop: ends the dictation and sends its final text. */
export const DictationStop = parts.Stop;
/** Cancel: ends the dictation and sends nothing. */
export const DictationCancel = parts.Cancel;
/** One bar of the waveform, whose `value` is its index. */
export const DictationBar = parts.Bar;
/** The mark beside the status: running while transcribing, an error after one. */
export const DictationStatusIcon = parts.StatusIcon;

// Levels are live state written as CSS variables, so only a change of `bars` renders the bars again.
const bars = (state: DictationWaveformState) => (
  <For each={Array.from({ length: state.bars })} keyed={false}>
    {(_, index) => <DictationBar value={String(index)} />}
  </For>
);

/** The waveform, one `DictationBar` per level unless you pass children. Shown while listening. */
export function DictationWaveform(props: DictationWaveformProps) {
  return <parts.Waveform {...omit(props, "children")}>{props.children ?? bars}</parts.Waveform>;
}

const status = (state: DictationStatusState) => (
  <>
    <DictationStatusIcon />
    <span data-dictation-text="">{state.text}</span>
  </>
);

/** "Listening" or the words heard so far, "Transcribing", or the error, with its mark unless you pass children. */
export function DictationStatus(props: DictationStatusProps) {
  return <parts.Status {...omit(props, "children")}>{props.children ?? status}</parts.Status>;
}

/**
 * A mic button that turns speech into text through a host's `source`. While listening it shows a waveform, the words
 * heard so far, Cancel and Stop, in the same box. Any `children` replace those parts.
 */
export function Dictation(props: DictationProps) {
  return (
    <parts.Root {...omit(props, "children")}>
      {props.children ?? (
        <>
          <DictationWaveform />
          <DictationStatus />
          <DictationStart />
          <DictationCancel />
          <DictationStop />
        </>
      )}
    </parts.Root>
  );
}
