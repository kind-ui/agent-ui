import { parts } from "./parts.js";

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

export { default as Dictation } from "./Dictation.svelte";
export { default as DictationStatus } from "./DictationStatus.svelte";
export { default as DictationWaveform } from "./DictationWaveform.svelte";
