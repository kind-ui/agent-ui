import type { ComponentProps } from "svelte";
import { parts } from "./parts.js";
import Transcript from "./Transcript.svelte";
import TranscriptCount from "./TranscriptCount.svelte";
import TranscriptList from "./TranscriptList.svelte";
import TranscriptSearch from "./TranscriptSearch.svelte";
import TranscriptSegment from "./TranscriptSegment.svelte";
import TranscriptSpeaker from "./TranscriptSpeaker.svelte";
import TranscriptText from "./TranscriptText.svelte";
import TranscriptTime from "./TranscriptTime.svelte";
import TranscriptWord from "./TranscriptWord.svelte";

/** A time as a button that seeks to its segment, rendered only while `onSeek` is set. Holds a `TranscriptTime`. */
export const TranscriptSeek = parts.Seek;
/** Scrolls the segments. Holds a `TranscriptList`. */
export const TranscriptViewport = parts.Viewport;

export {
  Transcript,
  TranscriptCount,
  TranscriptList,
  TranscriptSearch,
  TranscriptSegment,
  TranscriptSpeaker,
  TranscriptText,
  TranscriptTime,
  TranscriptWord,
};
export type TranscriptProps = ComponentProps<typeof Transcript>;
export type TranscriptSearchProps = ComponentProps<typeof TranscriptSearch>;
export type TranscriptCountProps = ComponentProps<typeof TranscriptCount>;
export type TranscriptListProps = ComponentProps<typeof TranscriptList>;
export type TranscriptSegmentProps = ComponentProps<typeof TranscriptSegment>;
export type TranscriptSpeakerProps = ComponentProps<typeof TranscriptSpeaker>;
export type TranscriptTimeProps = ComponentProps<typeof TranscriptTime>;
export type TranscriptTextProps = ComponentProps<typeof TranscriptText>;
export type TranscriptWordProps = ComponentProps<typeof TranscriptWord>;
