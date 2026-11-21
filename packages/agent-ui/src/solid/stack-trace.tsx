import { type StackTraceRow, stackTracePrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, omit, Show } from "solid-js";

const parts = createParts(stackTracePrimitive, {
  root: "div",
  trigger: "button",
  icon: "span",
  title: "span",
  content: "div",
  message: "div",
  copy: "button",
  list: "ol",
  frame: "li",
  "frame-open": "button",
  "frame-function": "span",
  "frame-location": "span",
  group: "li",
  library: "button",
  "library-frames": "ol",
});

export type StackTraceProps = ComponentProps<typeof parts.Root>;

/**
 * An error as a step: its name and message, then its frames, with consecutive library frames folded into one row.
 * Any `children` replace the default parts.
 */
export function StackTrace(props: StackTraceProps) {
  return <parts.Root {...omit(props, "children")}>{props.children ?? <DefaultParts />}</parts.Root>;
}

export const StackTraceTrigger = parts.Trigger;
export const StackTraceIcon = parts.Icon;
export const StackTraceContent = parts.Content;
export const StackTraceCopy = parts.Copy;
/** The frame's function and location as a button, rendered only while `onOpenFrame` is set. */
export const StackTraceFrameOpen = parts.FrameOpen;

export type StackTraceTitleProps = ComponentProps<typeof parts.Title>;

/** The `label`, else the message's first line with the error's name set apart, unless you pass children. */
export function StackTraceTitle(props: StackTraceTitleProps) {
  return (
    <parts.Title {...omit(props, "children")}>
      {props.children ??
        ((state: { name: string; summary: string }) => (
          <Show when={state.name} fallback={state.summary}>
            <span data-stack-trace-name="">{state.name}</span>: {state.summary}
          </Show>
        ))}
    </parts.Title>
  );
}

export type StackTraceMessageProps = ComponentProps<typeof parts.Message>;

/** The message's lines after its first, unless you pass children. Rendered only while there are any. */
export function StackTraceMessage(props: StackTraceMessageProps) {
  return (
    <parts.Message {...omit(props, "children")}>
      {props.children ?? ((state: { text: string }) => state.text)}
    </parts.Message>
  );
}

export type StackTraceListProps = ComponentProps<typeof parts.List>;

const rowKey = (row: StackTraceRow) => (row.type === "frame" ? row.index : `library-${row.start}`);
const rowValue = (row: StackTraceRow) => String(row.type === "frame" ? row.index : row.start);

/** A frame for each app frame and a group for each run of library frames, unless you pass children. */
export function StackTraceList(props: StackTraceListProps) {
  return (
    <parts.List {...omit(props, "children")}>
      {props.children ??
        ((state: { rows: StackTraceRow[] }) => (
          <For each={state.rows} keyed={rowKey}>
            {(row) => (
              <Show when={row().type === "frame"} fallback={<StackTraceGroup value={rowValue(row())} />}>
                <StackTraceFrame value={rowValue(row())} />
              </Show>
            )}
          </For>
        ))}
    </parts.List>
  );
}

export type StackTraceFrameProps = ComponentProps<typeof parts.Frame>;

/**
 * The frame whose index is `value`. Without children, it shows the frame's function and location, inside a
 * `StackTraceFrameOpen` while `onOpenFrame` is set.
 */
export function StackTraceFrame(props: StackTraceFrameProps) {
  return (
    <parts.Frame {...omit(props, "children")}>
      {props.children ??
        ((state: { canOpen: boolean }) => (
          <Show when={state.canOpen} fallback={<DefaultFrameText />}>
            <StackTraceFrameOpen>
              <DefaultFrameText />
            </StackTraceFrameOpen>
          </Show>
        ))}
    </parts.Frame>
  );
}

export type StackTraceFrameFunctionProps = ComponentProps<typeof parts.FrameFunction>;

/** The frame's function, unless you pass children. */
export function StackTraceFrameFunction(props: StackTraceFrameFunctionProps) {
  return (
    <parts.FrameFunction {...omit(props, "children")}>
      {props.children ?? ((state: { fn: string }) => state.fn)}
    </parts.FrameFunction>
  );
}

export type StackTraceFrameLocationProps = ComponentProps<typeof parts.FrameLocation>;

/** The frame's file, shortened to its last two segments, with line and column, unless you pass children. */
export function StackTraceFrameLocation(props: StackTraceFrameLocationProps) {
  return (
    <parts.FrameLocation {...omit(props, "children")}>
      {props.children ?? ((state: { location: string }) => state.location)}
    </parts.FrameLocation>
  );
}

export type StackTraceGroupProps = ComponentProps<typeof parts.Group>;

/**
 * The library frames that start at the index `value`, folded into one row. Without children, it shows a
 * `StackTraceLibrary` toggle and the frames.
 */
export function StackTraceGroup(props: StackTraceGroupProps) {
  return (
    <parts.Group {...omit(props, "children")}>
      {props.children ?? (
        <>
          <StackTraceLibrary />
          <StackTraceLibraryFrames />
        </>
      )}
    </parts.Group>
  );
}

export type StackTraceLibraryProps = ComponentProps<typeof parts.Library>;

/** Shows or folds library frames. "N library frames", unless you pass children. */
export function StackTraceLibrary(props: StackTraceLibraryProps) {
  return (
    <parts.Library {...omit(props, "children")}>
      {props.children ??
        ((state: { count: number }) => `${state.count} library ${state.count === 1 ? "frame" : "frames"}`)}
    </parts.Library>
  );
}

export type StackTraceLibraryFramesProps = ComponentProps<typeof parts.LibraryFrames>;

/** A group's frames, which open in place, unless you pass children. */
export function StackTraceLibraryFrames(props: StackTraceLibraryFramesProps) {
  return (
    <parts.LibraryFrames {...omit(props, "children")}>
      {props.children ??
        ((state: { indexes: number[] }) => (
          <For each={state.indexes}>{(index) => <StackTraceFrame value={String(index)} />}</For>
        ))}
    </parts.LibraryFrames>
  );
}

function DefaultFrameText() {
  return (
    <>
      <StackTraceFrameFunction />
      <StackTraceFrameLocation />
    </>
  );
}

function DefaultParts() {
  return (
    <>
      <StackTraceTrigger>
        <StackTraceIcon />
        <StackTraceTitle />
      </StackTraceTrigger>
      <StackTraceContent>
        <div data-stack-trace-panel="" data-kind-code="">
          <StackTraceMessage />
          <StackTraceList />
          <StackTraceCopy />
        </div>
      </StackTraceContent>
    </>
  );
}
