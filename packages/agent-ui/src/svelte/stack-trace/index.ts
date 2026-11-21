import type { ComponentProps } from "svelte";
import { parts } from "./parts.js";
import StackTrace from "./StackTrace.svelte";
import StackTraceFrame from "./StackTraceFrame.svelte";
import StackTraceFrameFunction from "./StackTraceFrameFunction.svelte";
import StackTraceFrameLocation from "./StackTraceFrameLocation.svelte";
import StackTraceGroup from "./StackTraceGroup.svelte";
import StackTraceLibrary from "./StackTraceLibrary.svelte";
import StackTraceLibraryFrames from "./StackTraceLibraryFrames.svelte";
import StackTraceList from "./StackTraceList.svelte";
import StackTraceMessage from "./StackTraceMessage.svelte";
import StackTraceTitle from "./StackTraceTitle.svelte";

export const StackTraceTrigger = parts.Trigger;
export const StackTraceIcon = parts.Icon;
export const StackTraceContent = parts.Content;
export const StackTraceCopy = parts.Copy;
/** The frame's function and location as a button, rendered only while `onOpenFrame` is set. */
export const StackTraceFrameOpen = parts.FrameOpen;

export {
  StackTrace,
  StackTraceFrame,
  StackTraceFrameFunction,
  StackTraceFrameLocation,
  StackTraceGroup,
  StackTraceLibrary,
  StackTraceLibraryFrames,
  StackTraceList,
  StackTraceMessage,
  StackTraceTitle,
};

export type StackTraceProps = ComponentProps<typeof StackTrace>;
export type StackTraceTitleProps = ComponentProps<typeof StackTraceTitle>;
export type StackTraceMessageProps = ComponentProps<typeof StackTraceMessage>;
export type StackTraceListProps = ComponentProps<typeof StackTraceList>;
export type StackTraceFrameProps = ComponentProps<typeof StackTraceFrame>;
export type StackTraceFrameFunctionProps = ComponentProps<typeof StackTraceFrameFunction>;
export type StackTraceFrameLocationProps = ComponentProps<typeof StackTraceFrameLocation>;
export type StackTraceGroupProps = ComponentProps<typeof StackTraceGroup>;
export type StackTraceLibraryProps = ComponentProps<typeof StackTraceLibrary>;
export type StackTraceLibraryFramesProps = ComponentProps<typeof StackTraceLibraryFrames>;
