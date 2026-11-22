import {
  type DictationStatusState,
  type DictationWaveformState,
  dictationButtonPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, h } from "vue";

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

const bars = ({ state }: { state: DictationWaveformState }) =>
  Array.from({ length: state.bars }, (_, i) => h(DictationBar, { key: i, value: String(i) }));

/** The waveform, one `DictationBar` per level unless you pass children. Shown while listening. */
export const DictationWaveform = defineComponent({
  name: "DictationWaveform",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(parts.Waveform, attrs, { ...slots, default: slots.default ?? bars });
  },
}) as unknown as typeof parts.Waveform;

const status = ({ state }: { state: DictationStatusState }) => [
  h(DictationStatusIcon),
  h("span", { "data-dictation-text": "" }, state.text),
];

/** "Listening" or the words heard so far, "Transcribing", or the error, with its mark unless you pass children. */
export const DictationStatus = defineComponent({
  name: "DictationStatus",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(parts.Status, attrs, { ...slots, default: slots.default ?? status });
  },
}) as unknown as typeof parts.Status;

const defaultParts = () => [
  h(DictationWaveform),
  h(DictationStatus),
  h(DictationStart),
  h(DictationCancel),
  h(DictationStop),
];

/**
 * A mic button that turns speech into text through a host's `source`. While listening it shows a waveform, the words
 * heard so far, Cancel and Stop, in the same box. A default slot replaces those parts.
 */
export const Dictation = defineComponent({
  name: "Dictation",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(parts.Root, attrs, { ...slots, default: slots.default ?? defaultParts });
  },
}) as unknown as typeof parts.Root;
